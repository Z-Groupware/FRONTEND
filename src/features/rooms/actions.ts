"use server";

import { revalidatePath } from "next/cache";

import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { PROJECT_TEAM_ACTIONS_MOCK } from "@/features/project/mock/team-actions";
import { getMockActor } from "@/lib/mock-actor";
import { canManageRooms, requiresParentTeamAction } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { RESERVATION_DURATION_MINUTES } from "./constants";
import { findMockMember } from "./mock/members";
import { addMockReservation, listMockReservationsByRoom } from "./mock/reservations";
import { addMockRoom, findMockRoom, updateMockRoom } from "./mock/rooms";
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

const ROOMS_PATH = "/app/rooms";
const MANAGE_ROOMS_PATH = "/manage/rooms";

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
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 예약 생성 요청을 보낸다.
    throw new Error("회의실 예약 API가 아직 연결되지 않았습니다.");
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
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 회의실 추가 요청을 보낸다.
    throw new Error("회의실 추가 API가 아직 연결되지 않았습니다.");
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
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 회의실 수정 요청을 보낸다.
    throw new Error("회의실 수정 API가 아직 연결되지 않았습니다.");
  }

  const room = updateMockRoom(id, draft);
  if (!room) return { errors: { name: "수정할 회의실을 찾을 수 없습니다" } };

  revalidatePath(MANAGE_ROOMS_PATH);
  revalidatePath(ROOMS_PATH);
  return { errors: {}, room };
}
