"use server";

import { revalidatePath } from "next/cache";

import { requireAccessToken } from "@/features/auth/session";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { PROJECT_TEAM_ACTIONS_MOCK } from "@/features/project/mock/team-actions";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { getMockActor } from "@/lib/mock-actor";
import { canManageRooms, requiresParentTeamAction } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { RESERVATION_DURATION_MINUTES } from "./constants";
import {
  type BeCreateMeetingResponse,
  type BeCreateMeetingRoomResponse,
  type BeMeetingRoom,
  toCreatedMeetingRoom,
  toCreateMeetingPayload,
  toCreateMeetingRoomPayload,
  toMeetingRoom,
  toReservationFromCreatedMeeting,
} from "./mapper";
import { findMockMember } from "./mock/members";
import { addMockReservation, listMockReservationsByRoom } from "./mock/reservations";
import { addMockRoom, deleteMockRoom, findMockRoom, updateMockRoom } from "./mock/rooms";
import { getMeetingRooms } from "./server";
import type {
  MeetingRoom,
  MeetingRoomDraft,
  MeetingRoomFormErrors,
  MeetingTopicInput,
  RoomReservation,
  RoomReservationDraft,
  RoomReservationFormErrors,
} from "./types";
import { validateMeetingRoomDraft, validateRoomReservationDraft } from "./validate";

const ROOM_NAME_CONFLICT_MESSAGE = "이미 같은 이름의 회의실이 있습니다";

const ROOM_NOT_FOUND_MESSAGE = "수정할 회의실을 찾을 수 없습니다";

/**
 * 회의실 추가·수정 API 실패를 폼 필드 오류로 바꾼다(ROOM-03·04 공통).
 * ⚠️ `MR-002`(이름 중복)는 `name` 칸에, `MR-003`(시간 역전)·`MR-006`(좁힌 시간 밖에 이미
 *    예약된 슬롯 있음)은 `closeTime` 칸에 붙인다 — 이 폼엔 "회의실 전체" 오류를 보여줄 자리가
 *    따로 없어서, 화면 가드가 이미 막아 준 `MR-004`(권한)를 포함해 나머지는 전부 `name` 칸에
 *    얹는다(기존 권한 오류와 같은 자리). `MR-001`(존재하지 않는 회의실, 수정 전용)은 mock
 *    분기의 "수정할 회의실을 찾을 수 없습니다"와 문구를 맞춘다.
 */
function toMeetingRoomFormErrors(error: unknown): MeetingRoomFormErrors {
  if (!(error instanceof ApiError)) throw error;

  switch (error.code) {
    case "MR-001":
      return { name: ROOM_NOT_FOUND_MESSAGE };
    case "MR-002":
      return { name: ROOM_NAME_CONFLICT_MESSAGE };
    case "MR-003":
    case "MR-006":
      return { closeTime: error.message };
    default:
      return { name: error.message };
  }
}

const ROOMS_PATH = "/app/rooms";
const MANAGE_ROOMS_PATH = "/manage/rooms";

/**
 * 회의 개설(`POST /api/meetings`, MEET-01) 실패를 폼 필드 오류로 바꾼다.
 * ⚠️ 필드 슬롯이 없는 오류(`PJ-001` 등)는 `title` 칸에 얹는다(회의실 도메인의 `toMeetingRoomFormErrors`
 *    와 같은 자리 — 이 폼도 "전체 오류"를 보여줄 별도 자리가 없다).
 */
function toMeetingCreateFormErrors(error: unknown): RoomReservationFormErrors {
  if (!(error instanceof ApiError)) throw error;

  switch (error.code) {
    case "MT-002":
      return { roomId: "그 시간에는 이미 예약된 회의실입니다" };
    case "MT-004":
      return { startTime: "회의실 이용 가능 시간 안에서 선택해 주세요" };
    case "MT-005":
      return { startTime: "예약은 30분 단위로만 가능합니다" };
    case "MT-010":
      return { attendeeIds: "존재하지 않는 참석자가 있습니다" };
    case "MT-012":
      return { startTime: "지난 시간은 선택할 수 없습니다" };
    case "MT-003":
      return { startTime: error.message };
    case "MR-001":
      return { roomId: "존재하지 않는 회의실입니다" };
    case "PJ-001":
      return { projectId: "존재하지 않는 프로젝트입니다" };
    default:
      return { title: error.message };
  }
}

/** 예약 폼 결과 — `useActionState`가 그대로 들고 있는 모양. */
export interface RoomReservationFormState {
  errors: RoomReservationFormErrors;
  /** 성공 시 서버 확정값 — 화면은 재조회 없이 이 값을 바로 반영한다(비관적 갱신, §토스트). */
  created?: RoomReservation;
}

function readTopics(formData: FormData): MeetingTopicInput[] {
  const mains = formData.getAll("topicMain");
  const subs = formData.getAll("topicSub");
  return mains.map((main, index) => ({ main: String(main), sub: String(subs[index] ?? "") }));
}

function readDraft(formData: FormData): RoomReservationDraft {
  const parentTeamActionId = formData.get("parentTeamActionId");
  return {
    title: String(formData.get("title") ?? ""),
    roomId: String(formData.get("roomId") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    topics: readTopics(formData),
    attendeeIds: formData.getAll("attendeeIds").map(Number),
    parentTeamActionId: parentTeamActionId ? Number(parentTeamActionId) : undefined,
  };
}

function toReservedRange(draft: RoomReservationDraft): { start: Date; end: Date } {
  const start = new Date(`${draft.date}T${draft.startTime}:00`);
  const end = new Date(start.getTime() + RESERVATION_DURATION_MINUTES * 60_000);
  return { start, end };
}

/**
 * 회의실 예약 생성 — 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ **비관적 갱신**이다 — 화면은 이 액션이 성공(created 반환)한 뒤에만 캘린더에 반영한다.
 *    드래그로 즉시 그려지는 예약이 아니라 모달 확인을 거치는 흐름이라 낙관적으로 먼저
 *    그릴 이유가 없다(요구사항: 선택→모달 확인→서버 성공 후에만 반영).
 * ⚠️ 같은 회의실·겹치는 시간대 예약은 여기서 막는다(도메인 정책: 동시간대 회의실 중복 불가) —
 *    화면에서 빈 슬롯만 눌러도 그 사이 다른 사람이 먼저 예약했을 수 있어 **서버에서 다시
 *    확인**해야 한다(§권한: 화면 숨김은 UX일 뿐 보안이 아니다).
 */
export async function createRoomReservationAction(
  _prev: RoomReservationFormState,
  formData: FormData,
): Promise<RoomReservationFormState> {
  const draft = readDraft(formData);
  const actor = getMockActor();
  const errors = validateRoomReservationDraft(draft, { role: actor.role });
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    const range = toReservedRange(draft);
    const accessToken = await requireAccessToken();
    try {
      const response = await serverApi<BeCreateMeetingResponse>(ep.meetings(), {
        method: "POST",
        accessToken,
        json: toCreateMeetingPayload(draft, range),
      });
      // ⚠️ 이름 조회는 이미 연동된 API(ROOM-01)만 쓴다 — 프로젝트 태그는 그 목록 API
      //    (`getReservableProjects`)가 아직 미연동이라(다른 이슈) 비워 둔다(§mapper 주석).
      const rooms = await getMeetingRooms();
      const roomName = rooms.find((room) => room.id === draft.roomId)?.name ?? draft.roomId;
      const created = toReservationFromCreatedMeeting(response, draft, range, {
        roomName,
        projectTag: "",
        ownerId: actor.id,
      });
      revalidatePath(ROOMS_PATH);
      return { errors: {}, created };
    } catch (error) {
      return { errors: toMeetingCreateFormErrors(error) };
    }
  }

  // ⚠️ 화면 select·피커가 이미 실제 목록에서만 고르게 해도, 폼은 조작될 수 있다
  //    (§권한: 화면 숨김은 UX일 뿐 보안이 아니다) — 참조값이 실제로 존재하는지 서버에서 다시 본다.
  if (!findMockRoom(draft.roomId)) {
    return { errors: { roomId: "존재하지 않는 회의실입니다" } };
  }
  const project = TOP_LEVEL_PROJECTS.find((item) => String(item.id) === draft.projectId);
  if (!project) {
    return { errors: { projectId: "존재하지 않는 프로젝트입니다" } };
  }
  if (draft.attendeeIds.some((id) => !findMockMember(id))) {
    return { errors: { attendeeIds: "존재하지 않는 참석자가 있습니다" } };
  }
  // ⚠️ Owner가 아니면 "상위 팀 액션"이 필수인데, 그 값이 진짜 이 프로젝트 소속이고 **자기
  //    팀**에 하달된 게 맞는지까지 다시 본다 — 화면이 이미 걸러 보여줘도, 폼은 조작될 수 있어서
  //    다른 팀의 팀 액션 id를 끼워 넣으면 그 팀 몫으로 회의가 잡히는 걸 여기서 막는다.
  if (requiresParentTeamAction(actor) && draft.parentTeamActionId !== undefined) {
    const teamAction = PROJECT_TEAM_ACTIONS_MOCK[project.tag]?.find(
      (item) => item.id === draft.parentTeamActionId,
    );
    if (!teamAction || teamAction.team !== actor.teamName) {
      return { errors: { parentTeamActionId: "존재하지 않는 상위 팀 액션입니다" } };
    }
  }

  const { start, end } = toReservedRange(draft);
  const overlapping = listMockReservationsByRoom(draft.roomId).some(
    (reservation) => reservation.start < end && reservation.end > start,
  );
  if (overlapping) {
    return { errors: { roomId: "그 시간에는 이미 예약된 회의실입니다" } };
  }

  const created = addMockReservation(draft, actor);
  revalidatePath(ROOMS_PATH);
  return { errors: {}, created };
}

/** 회의실 추가·수정 폼 결과 — `useActionState`가 그대로 들고 있는 모양. */
export interface MeetingRoomFormState {
  errors: MeetingRoomFormErrors;
  room?: MeetingRoom;
}

function readRoomDraft(formData: FormData): MeetingRoomDraft {
  return {
    name: String(formData.get("name") ?? ""),
    location: String(formData.get("location") ?? ""),
    openTime: String(formData.get("openTime") ?? ""),
    closeTime: String(formData.get("closeTime") ?? ""),
  };
}

/**
 * 회의실 추가(`/manage/rooms`, is_admin 전용) — 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ 예약 승인 절차가 없다(WORKFLOW.md §10-A) — 저장되는 즉시 `/app/rooms` 예약 모달의
 *    회의실 select에 나타난다.
 * ⚠️ **권한을 서버에서 다시 본다** — 화면 가드는 UX일 뿐 보안이 아니다(§권한).
 */
export async function createMeetingRoomAction(
  _prev: MeetingRoomFormState,
  formData: FormData,
): Promise<MeetingRoomFormState> {
  if (!canManageRooms(getMockActor())) {
    return { errors: { name: "회의실을 추가할 권한이 없습니다" } };
  }

  const draft = readRoomDraft(formData);
  const errors = validateMeetingRoomDraft(draft);
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    const accessToken = await requireAccessToken();
    try {
      const { meetingRoomId } = await serverApi<BeCreateMeetingRoomResponse>(ep.meetingRooms(), {
        method: "POST",
        accessToken,
        json: toCreateMeetingRoomPayload(draft),
      });
      revalidatePath(MANAGE_ROOMS_PATH);
      revalidatePath(ROOMS_PATH);
      return { errors: {}, room: toCreatedMeetingRoom(meetingRoomId, draft) };
    } catch (error) {
      return { errors: toMeetingRoomFormErrors(error) };
    }
  }

  const room = addMockRoom(draft);
  revalidatePath(MANAGE_ROOMS_PATH);
  revalidatePath(ROOMS_PATH);
  return { errors: {}, room };
}

/** 회의실 수정 — 추가와 같은 규칙(권한·검증). */
export async function updateMeetingRoomAction(
  _prev: MeetingRoomFormState,
  formData: FormData,
): Promise<MeetingRoomFormState> {
  if (!canManageRooms(getMockActor())) {
    return { errors: { name: "회의실을 수정할 권한이 없습니다" } };
  }

  const id = String(formData.get("id") ?? "");
  const draft = readRoomDraft(formData);
  const errors = validateMeetingRoomDraft(draft);
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    const accessToken = await requireAccessToken();
    try {
      const updated = await serverApi<BeMeetingRoom>(ep.meetingRoom(Number(id)), {
        method: "PATCH",
        accessToken,
        json: toCreateMeetingRoomPayload(draft),
      });
      revalidatePath(MANAGE_ROOMS_PATH);
      revalidatePath(ROOMS_PATH);
      return { errors: {}, room: toMeetingRoom(updated) };
    } catch (error) {
      return { errors: toMeetingRoomFormErrors(error) };
    }
  }

  const room = updateMockRoom(id, draft);
  if (!room) return { errors: { name: ROOM_NOT_FOUND_MESSAGE } };

  revalidatePath(MANAGE_ROOMS_PATH);
  revalidatePath(ROOMS_PATH);
  return { errors: {}, room };
}

/**
 * 회의실 삭제(비활성화) — 추가·수정과 같은 규칙(권한·`isMock` 분기). 되돌릴 수 없는 조작이라
 * 화면(`RoomDeleteDialog`)에서 확인 Dialog를 먼저 띄운 뒤에만 이 액션이 실행된다(§토스트: 파괴적
 * 작업은 Dialog). 같은 화면에 머무르므로 `deleteNoticeAction`과 달리 `redirect`는 없다.
 * ⚠️ **소프트 삭제다**(ROOM-05) — BE가 `deleted_at`만 채운다. 이미 없는(또는 이미 비활성인)
 *    회의실을 다시 지우면 `MR-001`(404)이 오는데, mock 분기의 "중복 삭제 요청은 조용히
 *    넘어간다"와 같은 결로 성공 취급한다(멱등). 미래 예약이 남아 있으면(`MR-005`, 409)
 *    그건 진짜 막아야 하는 오류라 그대로 던진다 — 화면은 `RoomDeleteDialog`가 확인 뒤 바로
 *    부르는 흐름이라 폼 오류 슬롯이 없고, 던진 오류는 가장 가까운 `error.tsx`가 받는다.
 */
export async function deleteMeetingRoomAction(formData: FormData): Promise<void> {
  if (!canManageRooms(getMockActor())) {
    throw new Error("회의실을 삭제할 권한이 없습니다");
  }

  const id = String(formData.get("id") ?? "");

  if (!isMock) {
    const accessToken = await requireAccessToken();
    try {
      await serverApi<null>(ep.meetingRoom(Number(id)), { method: "DELETE", accessToken });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return;
      throw error;
    }
    revalidatePath(MANAGE_ROOMS_PATH);
    revalidatePath(ROOMS_PATH);
    return;
  }

  deleteMockRoom(id);

  revalidatePath(MANAGE_ROOMS_PATH);
  revalidatePath(ROOMS_PATH);
}
