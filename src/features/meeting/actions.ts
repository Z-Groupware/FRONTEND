"use server";

import { revalidatePath } from "next/cache";

import { MEETING_STATUS } from "@/constants/meeting";
import { requireAccessToken } from "@/features/auth/session";
import { getManagedMember } from "@/features/member/manage-server";
import { findAttendeeScopeViolation } from "@/features/rooms/attendee-scope";
import { findMockMember } from "@/features/rooms/mock/members";
import { getReservableMembers } from "@/features/rooms/server";
import { getViewer } from "@/features/shell/viewer";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { getMockActor } from "@/lib/mock-actor";
import { type Actor, canManageMeeting } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import {
  attendeeIdsFrom,
  type BeMeetingDetail,
  type BeUpdateAttendeesResponse,
  hostIdOf,
  isClosed,
  parseMeetingDetail,
} from "./mapper";
import { cancelMockMeeting, findMockMeeting, updateMockMeetingAttendees } from "./mock/meetings";
import { meetingStatusOf } from "./status";

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

/** 재검증 실패 문구 — **목·실서버가 같은 문장을 쓴다**(두 경로가 갈리면 화면이 다른 말을 한다). */
const ATTENDEES_EDIT_ERROR = {
  notFound: "회의를 찾을 수 없습니다",
  forbidden: "참석자를 바꿀 권한이 없습니다",
  closed: "끝난 회의는 참석자를 바꿀 수 없습니다",
  unknownMember: "존재하지 않는 참석자가 있습니다",
} as const;

/**
 * 재검증에 필요한 **그 회의의 사실**(host·상태)을 실서버에서 가져온다 — `GET /api/meetings/{id}`
 * (MEET-04, 이미 연동된 엔드포인트다. 캡처 진입 `getLiveMeetingCapture`가 같은 값을 같은 식으로 읽는다).
 *
 * ⚠️ **없는 회의는 값(`null`)으로 돌린다** — 던지면 다이얼로그 대신 `error.tsx`가 뜨는데, 없는
 *    회의는 고장이 아니라 "그런 회의가 없습니다"라고 말해 줄 일이다(캡처 경로와 같은 판단).
 * ⚠️ 나머지 오류(403·500)는 그대로 던져 호출부의 `catch`가 BE 문구로 옮긴다.
 */
async function fetchMeetingFacts(
  meetingId: string,
  accessToken: string,
): Promise<BeMeetingDetail | null> {
  try {
    return parseMeetingDetail(
      await serverApi<unknown>(ep.meeting(Number(meetingId)), { accessToken }),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
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
 *    "팀장만"으로 뒤바뀐다. mock은 회의 레코드가 `hostAuthority`를 직접 들고 있어 그걸 쓰고,
 *    실서버는 MEET-04 응답에 host의 role·team이 없어 actor===host면 세션 값을, 아니면
 *    `getManagedMember`로 따로 구한다(아래 실서버 분기 주석).
 */
export async function updateMeetingAttendeesAction(
  _prev: UpdateMeetingAttendeesState,
  formData: FormData,
): Promise<UpdateMeetingAttendeesState> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const attendeeIds = formData.getAll("attendeeIds").map(Number);
  /*
    ⚠️ **실서버에서는 목 액터를 쓰지 않는다.** `getMockActor()`는 고정 OWNER를 돌려주는 목이라
       실연동에서 그걸로 권한을 재면 "언제나 통과"가 된다 — 세션에서 읽는다(`rooms/actions.ts`와
       같은 자리, CLAUDE.md §권한: 판정은 서버에서).
  */
  const actor = isMock ? getMockActor() : await getViewer();

  if (isMock) {
    const meeting = findMockMeeting(meetingId);
    if (!meeting) return { error: ATTENDEES_EDIT_ERROR.notFound, attendeeIds: null };
    if (!canManageMeeting(actor, { hostId: meeting.hostId })) {
      return { error: ATTENDEES_EDIT_ERROR.forbidden, attendeeIds: null };
    }
    /*
      ⚠️ 취소된 회의도 여기서 걸린다 — 명단을 고칠 자리가 아닌데 화면 계약에 아직 취소 문구가
         없어서 "이미 끝난 회의"와 같은 자리로 보낸다(매퍼 `isClosed`와 같은 판단·같은 결과).
         실서버 경로가 `isClosed`로 둘을 함께 막으므로, 목만 취소를 통과시키면 두 모드가 갈린다.
    */
    const status = meetingStatusOf(meeting, new Date());
    if (status === MEETING_STATUS.DONE || status === MEETING_STATUS.CANCELED) {
      return { error: ATTENDEES_EDIT_ERROR.closed, attendeeIds: null };
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

  const meeting = await fetchMeetingFacts(meetingId, accessToken);
  if (!meeting) return { error: ATTENDEES_EDIT_ERROR.notFound, attendeeIds: null };
  const hostId = hostIdOf(meeting);
  if (!canManageMeeting(actor, { hostId })) {
    return { error: ATTENDEES_EDIT_ERROR.forbidden, attendeeIds: null };
  }
  if (isClosed(meeting)) {
    return { error: ATTENDEES_EDIT_ERROR.closed, attendeeIds: null };
  }

  /*
    ⚠️ **참석자 서버 재검증** — `GET /api/members/my-team`이 붙으면서 대부분의 경로는 이제
       실서버에서도 볼 수 있다(2026-08-13, `rooms/server.ts`의 `getReservableMembers`).
    ⚠️ **범위 기준은 지금 보는 사람이 아니라 host다**(위 함수 주석). 두 경로로 갈린다:
       - **host 자신이 고치는 보통 경로**: 세션에 이미 host의 role·team이 있다 — 그대로 쓴다.
       - **OWNER·ADMIN이 남의 회의를 고치는 드문 경로**: `canManageMeeting`이 그걸 허용해서
         생기는 경우다. 이 분기에 오려면 actor가 반드시 OWNER 아니면 ADMIN이므로,
         OWNER·ADMIN 전용 API(`GET /api/members/{id}`, `getManagedMember`)로 host의
         role·team을 따로 구해도 안전하다(actor 자신은 그 API를 부를 권한이 있다).
    ⚠️ **딱 한 칸은 여기서도 못 본다 — 본 척하지 않는다**(§정직성). "OWNER·ADMIN이 다른
       LEADER·MEMBER의 회의를 고치는" 경우, `GET /api/members/my-team`은 **호출자의 토큰**
       으로 팀을 정하지 host의 팀이 아니다 — host의 팀 로스터를 이 API로는 구할 수 없다.
       이 한 칸만 FE 검증을 건너뛰고 BE(`PUT /api/meetings/{id}/attendees`)가 최종 방어한다
       — **아직 BE 요청 문서에 못 올렸다**, 다음 라운드에 올릴 것. UI는 애초에 이 경로로 못
       들어온다(`canEditMeetingAttendees`가 `isHost`를 요구한다) — 직접 요청을 조작해야만
       닿는 자리라 영향은 방어 심도 문제다.
  */
  let scopeActor: Actor | null;
  if (actor.id === hostId) {
    scopeActor = actor;
  } else {
    const hostDetail = await getManagedMember(hostId);
    scopeActor = hostDetail
      ? {
          id: hostId,
          role: hostDetail.member.authority,
          teamName: hostDetail.member.teamName ?? undefined,
        }
      : null;
  }

  /*
    ⚠️ Owner-호스트냐 아니냐는 `getReservableMembers`가 안에서 이미 가른다(`rooms/server.ts`)
       — 여기서 또 나누지 않는다.
  */
  if (scopeActor) {
    const roster = await getReservableMembers(scopeActor);
    const rosterIds = new Set(roster.map((member) => member.id));
    if (attendeeIds.some((id) => id !== hostId && !rosterIds.has(id))) {
      return { error: "지정할 수 없는 참석자가 있습니다", attendeeIds: null };
    }
  }
  // scopeActor가 null인 건 위 주석의 "한 칸"뿐이다 — BE가 마저 본다.

  try {
    /*
      ⚠️ **여기서 host를 끼워 넣지 않는다.** "host 자동 포함·제거 불가"는 계약이 **서버 책임**
         이라고 명시한 규칙이라(MEET-09), FE가 host를 직접 끼워 넣으면 오히려 명단을 틀리게
         만든다 — 서버가 대신 채운다.
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
