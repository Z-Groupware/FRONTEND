"use server";

import { revalidatePath } from "next/cache";

import { AUTHORITY, type Authority } from "@/constants/authority";
import { MEETING_STATUS } from "@/constants/meeting";
import { requireAccessToken } from "@/features/auth/session";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { PROJECT_TEAM_ACTIONS_MOCK } from "@/features/project/mock/team-actions";
import {
  type AttendeeScopeViewer,
  findAttendeeScopeViolation,
} from "@/features/rooms/attendee-scope";
import { findMockMember } from "@/features/rooms/mock/members";
import { getViewer } from "@/features/shell/viewer";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { getMockActor } from "@/lib/mock-actor";
import { type Actor, canManageMeeting, requiresParentTeamAction } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { checkMeetingTitle } from "./lib";
import { attendeeIdsFrom, type BeUpdateAttendeesResponse } from "./mapper";
import {
  addMockOnlineMeeting,
  cancelMockMeeting,
  findMockMeeting,
  updateMockMeeting,
  updateMockMeetingAttendees,
} from "./mock/meetings";
import { meetingStatusOf } from "./status";
import type {
  MeetingDraft,
  MeetingTopic,
  OnlineMeetingDraft,
  OnlineMeetingFormErrors,
} from "./types";
import { validateOnlineMeetingDraft } from "./validate";

const MEETING_LIST_PATH = "/app/meeting";

/** 참석자 교체 폼 결과 — `useActionState`가 그대로 들고 있는 모양. */
export interface UpdateMeetingAttendeesState {
  error: string | null;
  /** 성공 시 서버 확정 명단 — 다이얼로그는 재조회 없이 이 값을 바로 반영한다(비관적 갱신). */
  attendeeIds: number[] | null;
}

/**
 * `PUT /api/meetings/{meetingId}/attendees`(MEET-09) 실패를 문구 하나로 바꾼다.
 * ⚠️ 이 다이얼로그엔 필드별 오류 자리가 없다(참석자 하나뿐인 폼) — 전부 한 줄 오류로 보여준다.
 */
function toAttendeesErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) throw error;
  return error.message;
}

/**
 * 참석자 명단 교체(MEET-09) — **전체 명단 교체**다. `RoomReservation`의 참석자 피커를 그대로
 * 재사용하는 다이얼로그(`MeetingAttendeesEditDialog`)가 이 액션을 부른다.
 * ⚠️ 권한은 `canManageMeeting`(host·OWNER·ADMIN) 하나로 본다 — 화면 가드는 UX일 뿐이라
 *    여기서 다시 확인한다(§권한).
 * ⚠️ **host는 자동 포함·제거 불가**다 — 이 액션이 직접 끼워 넣지는 않는다. mock 분기는
 *    `updateMockMeetingAttendees`가, 실연동은 서버(BE)가 그 규칙을 보장한다.
 * ⚠️ **참석자 범위 규칙(2026-08-13 확정)이 여기에도 걸린다** — 개설(회의실 예약)만 막고 교체를
 *    열어 두면 만든 뒤에 규칙을 깨서 넣을 수 있고, "Owner 개설 회의의 참석자는 전부 팀장"이라는
 *    AI 팀 액션 판단 근거가 똑같이 무너진다. 규칙은 `rooms/attendee-scope.ts` 한 곳이다.
 * ⚠️ 범위 기준은 **지금 보는 사람이 아니라 그 회의의 host**다 — `canManageMeeting`이 OWNER·Admin
 *    에게도 남의 회의 교체를 허용해서, actor로 재면 Owner가 남의 팀 회의를 열었을 때 규칙이
 *    "팀장만"으로 뒤바뀐다. 회의에 적힌 `hostAuthority`가 그 회의가 만들어질 때의 사실이다.
 */
export async function updateMeetingAttendeesAction(
  _prev: UpdateMeetingAttendeesState,
  formData: FormData,
): Promise<UpdateMeetingAttendeesState> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const attendeeIds = formData.getAll("attendeeIds").map(Number);
  const actor = getMockActor();

  if (isMock) {
    const meeting = findMockMeeting(meetingId);
    if (!meeting) return { error: "회의를 찾을 수 없습니다", attendeeIds: null };
    if (!canManageMeeting(actor, { hostId: meeting.hostId })) {
      return { error: "참석자를 바꿀 권한이 없습니다", attendeeIds: null };
    }
    if (meetingStatusOf(meeting, new Date()) === MEETING_STATUS.DONE) {
      return { error: "끝난 회의는 참석자를 바꿀 수 없습니다", attendeeIds: null };
    }

    /*
      ⚠️ **참석자 서버 재검증**(§권한: 화면 숨김은 UX일 뿐 보안이 아니다). 다이얼로그가 후보를
         좁혀 보여줘도 이 액션은 주소만 알면 직접 부를 수 있다.
      ⚠️ host의 팀 이름은 **명부에서 찾는다** — 회의 레코드에는 `hostTeamId`(숫자)만 있고 범위
         비교는 팀 **이름**으로 도는데(`RoomMember.teamName`), 팀 registry(id↔이름)가 아직
         없어서다(`lib/permission.ts` `Actor.teamName` 주석과 같은 사정). host가 명부에 없으면
         범위를 못 재므로 통과시키지 않는다(§정직성).
    */
    const attendees = attendeeIds.map(findMockMember);
    if (attendees.some((member) => member === null)) {
      return { error: "존재하지 않는 참석자가 있습니다", attendeeIds: null };
    }
    const scopeViolation = findAttendeeScopeViolation(
      attendees.filter((member) => member !== null),
      {
        id: meeting.hostId,
        role: meeting.hostAuthority,
        teamName: findMockMember(meeting.hostId)?.teamName ?? null,
      },
    );
    if (scopeViolation) return { error: scopeViolation, attendeeIds: null };

    const updated = updateMockMeetingAttendees(meetingId, attendeeIds);
    revalidatePath(`/app/meeting/${meetingId}`);
    return { error: null, attendeeIds: updated?.attendeeIds ?? null };
  }

  const accessToken = await requireAccessToken();
  try {
    /*
      ⚠️ **참석자 범위는 여기서 못 본다 — 본 척하지 않는다**(§정직성). 명부(`getReservableMembers`)가
         실연동에서 그대로 던지고, 명부 API도 권한별로 갈려 MEMBER는 자기 팀 명단을 볼 길이 없다
         (`rooms/actions.ts`의 같은 자리 주석에 근거를 적어 뒀다). **최종 방어는 BE다** —
         `PUT /api/meetings/{id}/attendees`는 [확인] 현재 존재·같은 회사만 보고 권한·팀은 전혀
         안 본다(`MeetingAttendeeCommandService#findAndValidateMembers`). BE 요청 문서에 올린다.
    */
    /*
      ⚠️ **여기서 host를 끼워 넣지 않는다.** 이 액션은 지금 보는 사람(`actor`)이 host인지
      모른다(OWNER·Admin이 남의 회의를 고치는 경우도 있다, `canManageMeeting`) — "host 자동
      포함·제거 불가"는 계약이 **서버 책임**이라고 명시한 규칙이라(MEET-09), FE가 잘못된
      사람(지금 보는 사람)을 host로 끼워 넣으면 오히려 명단을 틀리게 만든다.
    */
    const response = await serverApi<BeUpdateAttendeesResponse>(
      ep.meetingAttendees(Number(meetingId)),
      { method: "PUT", accessToken, json: { attendeeMemberIds: attendeeIds } },
    );
    revalidatePath(`/app/meeting/${meetingId}`);
    // ⚠️ 서버가 돌려준 명단을 쓴다(§mapper) — host 자동 포함·중복 제거가 이미 반영돼 있다.
    return { error: null, attendeeIds: attendeeIdsFrom(response) };
  } catch (error) {
    return { error: toAttendeesErrorMessage(error), attendeeIds: null };
  }
}

/** 회의 취소 결과 — 다이얼로그가 성공/실패만 보고 토스트를 띄운다(필드 오류 자리가 없다). */
export interface CancelMeetingResult {
  error: string | null;
}

/**
 * `DELETE /api/meetings/{meetingId}`(MEET-06) 실패를 문구 하나로 바꾼다.
 * ⚠️ BE의 `message`가 이미 화면에 띄울 한국어 문장이다(§lib/api) — 코드로 문구를 새로 짓지 않는다.
 */
function toCancelErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) throw error;
  return error.message;
}

/**
 * 회의 취소(MEET-06) — **시작 전 회의만** 가능. 취소된 회의는 소프트 취소로 남는다(물리 삭제 아님).
 * ⚠️ 권한은 `canManageMeeting`(host·OWNER·ADMIN) — MEET-09와 같은 축이다(§권한).
 * ⚠️ "이미 시작된 회의"는 여기서 취소가 아니라 종료(MEET-08, 캡처 화면)를 써야 한다 —
 *    화면은 SCHEDULED일 때만 [회의 취소]를 보여주지만, 서버에서 다시 확인한다.
 */
export async function cancelMeetingAction(meetingId: string): Promise<CancelMeetingResult> {
  const actor = getMockActor();

  if (isMock) {
    const meeting = findMockMeeting(meetingId);
    if (!meeting) return { error: "회의를 찾을 수 없습니다" };
    if (!canManageMeeting(actor, { hostId: meeting.hostId })) {
      return { error: "회의를 취소할 권한이 없습니다" };
    }
    if (meetingStatusOf(meeting, new Date()) !== MEETING_STATUS.SCHEDULED) {
      return { error: "이미 시작된 회의는 취소할 수 없습니다 — 종료를 이용해 주세요" };
    }

    cancelMockMeeting(meetingId, new Date().toISOString());
    revalidatePath(`/app/meeting/${meetingId}`);
    revalidatePath(MEETING_LIST_PATH);
    return { error: null };
  }

  const accessToken = await requireAccessToken();
  try {
    await serverApi<null>(ep.meeting(Number(meetingId)), { method: "DELETE", accessToken });
    revalidatePath(`/app/meeting/${meetingId}`);
    revalidatePath(MEETING_LIST_PATH);
    return { error: null };
  } catch (error) {
    return { error: toCancelErrorMessage(error) };
  }
}

/** 회의 수정 폼 결과 — `useActionState`가 그대로 들고 있는 모양(MEET-09 폼과 같은 골격). */
export interface UpdateMeetingState {
  error: string | null;
  /**
   * 성공한 저장의 표식 — 다이얼로그가 이 값이 바뀐 걸 보고 닫는다.
   *
   * ⚠️ `boolean`으로 두면 **두 번째 저장을 못 알아챈다.** 창을 다시 열어 또 고치면 `true`에서
   *    `true`라 값이 안 바뀌고, `useEffect`가 안 돈다(MEET-09 폼이 `attendeeIds` 배열
   *    참조로 같은 문제를 피한 자리다). 저장할 때마다 새 객체를 만든다.
   */
  saved: { title: string } | null;
}

/**
 * `PATCH /api/meetings/{meetingId}`(MEET-05) 실패를 문구 하나로 바꾼다.
 * ⚠️ BE의 `message`가 이미 화면에 띄울 한국어 문장이다(§lib/api) — 코드로 문구를 새로 짓지 않는다.
 *    상태 위반(409 `MT-014`)·30분 그리드(400 `MT-005`)·중복 예약(409 `MT-002`)이 전부 여기로 온다.
 */
function toUpdateErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) throw error;
  return error.message;
}

/**
 * 회의 정보 수정(MEET-05) — **시작 전 회의만**. 상세 머리글의 [회의 수정]이 부른다.
 *
 * ⚠️ **지금 보내는 건 제목뿐이다.** BE는 `title`·`projectId`·`meetingRoomId`·`startAt`·`endAt`·
 *    `recordingConsent` 6개를 부분 수정으로 받지만, 뒤의 다섯은 **예약 슬롯을 다시 잡는 일**이라
 *    회의실 예약 화면의 슬롯 피커(30분 그리드·운영시간·중복 검사)를 그대로 끌어와야 한다 —
 *    반쯤 되는 폼을 먼저 내보내지 않는다(§정직성, 이슈 #419 후속).
 * ⚠️ **보낸 키만 바뀐다.** BE가 미전달과 명시적 null을 가르므로(`@JsonSetter`) 본문에
 *    `title` 하나만 싣는다 — 나머지를 `null`로 채워 보내면 필수 컬럼을 지우라는 뜻이 돼 400이다.
 * ⚠️ 권한은 `canManageMeeting`(host·OWNER·ADMIN) 하나로 본다 — 취소(MEET-06)와 같은 축이고
 *    BE `MeetingUpdateService.canManageMeeting`과 같은 범위다. 화면은 host에게만 버튼을
 *    보여주지만(`canEditMeeting`) 화면 가드는 UX일 뿐이라 여기서 다시 확인한다(§권한).
 * ⚠️ 상태 관문(`SCHEDULED`)도 다시 본다 — 목은 여기가 유일한 서버고, 실연동은 BE가 409
 *    `MT-014`로 막는다. 둘 다 한다(화면 숨김은 UX, 서버 재검사가 보안).
 */
export async function updateMeetingAction(
  _prev: UpdateMeetingState,
  formData: FormData,
): Promise<UpdateMeetingState> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const checked = checkMeetingTitle(String(formData.get("title") ?? ""));
  if (!checked.ok) return { error: checked.error, saved: null };

  const actor = getMockActor();

  if (isMock) {
    const meeting = findMockMeeting(meetingId);
    if (!meeting) return { error: "회의를 찾을 수 없습니다", saved: null };
    if (!canManageMeeting(actor, { hostId: meeting.hostId })) {
      return { error: "회의를 수정할 권한이 없습니다", saved: null };
    }
    if (meetingStatusOf(meeting, new Date()) !== MEETING_STATUS.SCHEDULED) {
      return { error: "이미 시작된 회의는 수정할 수 없습니다", saved: null };
    }

    updateMockMeeting(meetingId, { title: checked.title });
    revalidatePath(`/app/meeting/${meetingId}`);
    revalidatePath(MEETING_LIST_PATH);
    return { error: null, saved: { title: checked.title } };
  }

  const accessToken = await requireAccessToken();
  try {
    /*
      ⚠️ **응답을 안 읽는다.** MEET-05의 200 본문은 `meetingId`·`status`·`startAt`·`endAt`·
         `meetingRoom`뿐이라 **방금 고친 제목이 안 들어 있다**(BE `UpdateMeetingResponse`) —
         참석자 교체(MEET-09)처럼 서버 확정값으로 비관적 갱신을 할 수 없다. 그래서 화면은
         `revalidatePath`로 다시 읽는다.
    */
    await serverApi<unknown>(ep.meeting(Number(meetingId)), {
      method: "PATCH",
      accessToken,
      json: { title: checked.title },
    });
    revalidatePath(`/app/meeting/${meetingId}`);
    revalidatePath(MEETING_LIST_PATH);
    return { error: null, saved: { title: checked.title } };
  } catch (error) {
    return { error: toUpdateErrorMessage(error), saved: null };
  }
}

/**
 * 참석자 범위 판정에 필요한 최소 정보만 `Actor`에서 뽑는다(`attendee-scope.ts`).
 * ⚠️ `rooms/actions.ts`에 같은 이름의 헬퍼가 있지만 export되지 않아 여기서 다시 만든다 —
 *    로직은 한 줄이라 두 벌이어도 어긋날 여지가 없다(`updateMeetingAttendeesAction`도 같은
 *    모양을 인라인으로 쓴다).
 */
function toAttendeeScopeViewer(actor: Actor): AttendeeScopeViewer {
  return { id: actor.id, role: actor.role, teamName: actor.teamName ?? null };
}

/** 비대면 회의 만들기 폼 결과 — `useActionState`가 그대로 들고 있는 모양. */
export interface OnlineMeetingFormState {
  errors: OnlineMeetingFormErrors;
  /** 성공 시 방금 만든 회의 id — 다이얼로그가 이 값으로 상세로 이동한다(재조회 없이). */
  created?: { id: string };
}

function readOnlineMeetingDraft(formData: FormData): OnlineMeetingDraft {
  const parentTeamActionId = formData.get("parentTeamActionId");
  const recordingFileName = formData.get("recordingFileName");
  const mains = formData.getAll("topicMain");
  const subs = formData.getAll("topicSub");

  return {
    title: String(formData.get("title") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    topics: mains.map((main, index) => ({ main: String(main), sub: String(subs[index] ?? "") })),
    attendeeIds: formData.getAll("attendeeIds").map(Number),
    parentTeamActionId: parentTeamActionId ? Number(parentTeamActionId) : undefined,
    recordingFileName: recordingFileName ? String(recordingFileName) : null,
  };
}

/**
 * 비대면 회의 만들기(이슈 #473) — `/app/meeting` 목록의 [비대면 회의] 버튼이 부른다.
 *
 * ⚠️ **BE API가 아직 안 정해졌다**(1안/2안 논의 중, 팀원 회신 — 이슈 #473). 추측 요청을 보내지
 *    않는다(CLAUDE.md §연동 검증: Swagger·구두 추측 금지) — 실서버 분기는 확정될 때까지
 *    "아직 준비 중"이라고 정직하게 말한다(§정직성). 확정되면 이 분기만 실서버 호출로 바꾼다
 *    (§Mock 격리막).
 * ⚠️ **제출하면 그 자리에서 완료 처리된다** — 회의실 예약(`createRoomReservationAction`)과
 *    달리 캡처 화면으로 안 넘어간다(팀 명세). 그래서 회의실·시간을 아예 안 받는다.
 * ⚠️ mock 분기의 검증 순서는 `createRoomReservationAction`과 맞춘다(프로젝트 → 참석자 범위 →
 *    상위 팀 액션) — 같은 도메인의 두 생성 경로가 다른 순서로 막히면 같은 실수가 화면마다
 *    다른 첫 오류로 보인다.
 */
export async function createOnlineMeetingAction(
  _prev: OnlineMeetingFormState,
  formData: FormData,
): Promise<OnlineMeetingFormState> {
  const draft = readOnlineMeetingDraft(formData);
  const actor = isMock ? getMockActor() : await getViewer();
  const errors = validateOnlineMeetingDraft(draft, { role: actor.role });
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    // ⚠️ BE API가 아직 안 정해졌다(1안/2안 논의 중, 이슈 #473) — 추측 요청을 보내지 않는다
    //    (CLAUDE.md §연동 검증: Swagger·구두 추측 금지). 확정되면 이 분기를 실서버 호출로 바꾼다.
    return { errors: { title: "비대면 회의는 아직 준비 중입니다 — 곧 지원됩니다" } };
  }

  // ⚠️ 화면 select·피커가 이미 실제 목록에서만 고르게 해도, 폼은 조작될 수 있다
  //    (§권한: 화면 숨김은 UX일 뿐 보안이 아니다) — 참조값이 실제로 존재하는지 서버에서 다시 본다.
  const project = TOP_LEVEL_PROJECTS.find((item) => String(item.id) === draft.projectId);
  if (!project) {
    return { errors: { projectId: "존재하지 않는 프로젝트입니다" } };
  }

  /*
    ⚠️ **참석자 서버 재검증**(`createRoomReservationAction`과 같은 규칙, 2026-08-13 확정).
       화면 피커가 후보를 좁혀 보여줘도 Server Action은 주소만 알면 직접 부를 수 있어, 제출된
       id가 **실존하는지**와 **범위 안인지**를 여기서 다시 본다. 규칙 자체는 `attendee-scope.ts`
       한 곳이다 — 화면과 서버가 갈리면 안 된다.
  */
  const attendees = draft.attendeeIds.map(findMockMember);
  if (attendees.some((member) => member === null)) {
    return { errors: { attendeeIds: "존재하지 않는 참석자가 있습니다" } };
  }
  const scopeViolation = findAttendeeScopeViolation(
    attendees.filter((member) => member !== null),
    toAttendeeScopeViewer(actor),
  );
  if (scopeViolation) return { errors: { attendeeIds: scopeViolation } };

  // ⚠️ Owner가 아니면 "상위 팀 액션"이 필수인데, 그 값이 진짜 이 프로젝트 소속이고 **자기
  //    팀**에 하달된 게 맞는지까지 다시 본다 — `createRoomReservationAction`과 같은 검사다.
  if (requiresParentTeamAction(actor) && draft.parentTeamActionId !== undefined) {
    const teamAction = PROJECT_TEAM_ACTIONS_MOCK[project.tag]?.find(
      (item) => item.id === draft.parentTeamActionId,
    );
    if (!teamAction || teamAction.team !== actor.teamName) {
      return { errors: { parentTeamActionId: "존재하지 않는 상위 팀 액션입니다" } };
    }
  }

  // ⚠️ `Meeting.topics`는 최소 1개짜리 튜플 타입이다 — 위 검증이 이미 최소 1쌍을 보장했다
  //    (`rooms/mock/reservations.ts`의 `addMockReservation`과 같은 처리).
  const trimmedTopics = draft.topics.map((topic) => ({
    main: topic.main.trim(),
    sub: topic.sub.trim(),
  }));
  const [firstTopic, ...restTopics] = trimmedTopics;
  const topics: [MeetingTopic, ...MeetingTopic[]] = [firstTopic!, ...restTopics];
  const attendeeIds = Array.from(new Set([actor.id, ...draft.attendeeIds]));

  const meetingCommon = {
    title: draft.title.trim(),
    // ⚠️ 비대면 회의는 회의실·시간이 없다(이슈 #473) — mock 스토어(`addMockOnlineMeeting`)가
    //    저장 직전에 실제 시각(제출 시각)을 채운다. 여기서는 판별식 유니언 조립에 필요한
    //    최소값만 넣는다.
    start: new Date(0),
    end: new Date(0),
    roomId: null,
    roomName: null,
    roomReservationId: null,
    isOnline: true,
    recordingFileName: draft.recordingFileName,
    projectId: project.id,
    projectTag: project.tag,
    topics,
    attendeeIds,
    hostId: actor.id,
  };

  // ⚠️ `Meeting`은 Owner 개설/팀 액션 개설을 판별식 유니언으로 나눠 둔다 — 같은 분기를
  //    `rooms/mock/reservations.ts`의 `addMockReservation`이 쓴다(같은 규칙, 다른 생성 경로).
  const meetingDraft: MeetingDraft = requiresParentTeamAction(actor)
    ? {
        ...meetingCommon,
        hostAuthority: actor.role as Extract<Authority, "LEADER" | "MEMBER">,
        hostTeamId: actor.teamId!,
        parentTeamActionId: draft.parentTeamActionId!,
      }
    : { ...meetingCommon, hostAuthority: AUTHORITY.OWNER };

  const meeting = addMockOnlineMeeting(meetingDraft);
  revalidatePath(MEETING_LIST_PATH);
  return { errors: {}, created: { id: meeting.id } };
}
