"use server";

import { revalidatePath } from "next/cache";

import { MEETING_STATUS } from "@/constants/meeting";
import { requireAccessToken } from "@/features/auth/session";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { getMockActor } from "@/lib/mock-actor";
import { canManageMeeting } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { attendeeIdsFrom, type BeUpdateAttendeesResponse } from "./mapper";
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

/**
 * 참석자 명단 교체(MEET-09) — **전체 명단 교체**다. `RoomReservation`의 참석자 피커를 그대로
 * 재사용하는 다이얼로그(`MeetingAttendeesEditDialog`)가 이 액션을 부른다.
 * ⚠️ 권한은 `canManageMeeting`(host·OWNER·ADMIN) 하나로 본다 — 화면 가드는 UX일 뿐이라
 *    여기서 다시 확인한다(§권한).
 * ⚠️ **host는 자동 포함·제거 불가**다 — 이 액션이 직접 끼워 넣지는 않는다. mock 분기는
 *    `updateMockMeetingAttendees`가, 실연동은 서버(BE)가 그 규칙을 보장한다.
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

    const updated = updateMockMeetingAttendees(meetingId, attendeeIds);
    revalidatePath(`/app/meeting/${meetingId}`);
    return { error: null, attendeeIds: updated?.attendeeIds ?? null };
  }

  const accessToken = await requireAccessToken();
  try {
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
