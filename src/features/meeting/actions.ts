"use server";

import { revalidatePath } from "next/cache";

import { AI_SUMMARY_STATUS } from "@/constants/meeting";
import { requireAccessToken } from "@/features/auth/session";
import { serverApi, toUserMessage } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { findMockMeeting, setMockSummaryStatus } from "./mock/meetings";
import { ensureMockMeetingsSeeded } from "./mock/seed";

/**
 * 회의 목록 화면의 변경 창구 — 지금은 **재요약 하나뿐**이다(§Mock 격리막).
 *
 * ⚠️ **재분석 요청이지 재제출이 아니다**(WORKFLOW §3-5). 녹음 파일은 종료 때 이미 서버에
 *    올라갔다 — 실패한 건 분석뿐이라 회의를 다시 할 필요가 없다.
 * ⚠️ **토큰은 브라우저로 안 나간다**(§핵심 4원칙 ②).
 */

export interface MeetingActionResult {
  ok: boolean;
  error?: string;
}

export async function requestResummaryAction(meetingId: string): Promise<MeetingActionResult> {
  if (!isMock) {
    /*
      ⚠️ **가정 shape·미검증**(§연동 검증). BE 레포에 재분석 요청 엔드포인트가 아직 없다 —
         `/processing-status`(조회)만 있고 그마저 S3·Transcribe가 스텁이라 안 돈다.
         담당자 도메인 문서를 받아 경로·메서드를 맞춘 뒤 이 줄을 고친다.
    */
    try {
      const accessToken = await requireAccessToken();
      await serverApi<unknown>(ep.meetingResummarize(Number(meetingId)), {
        method: "POST",
        accessToken,
      });
    } catch (error) {
      return { ok: false, error: toUserMessage(error) };
    }
    revalidatePath("/app/meeting");
    return { ok: true };
  }

  ensureMockMeetingsSeeded();
  const meeting = findMockMeeting(meetingId);
  /*
    ⚠️ **실패한 회의만 다시 돌린다.** 이 검사가 없으면 이미 분배까지 끝난 회의를 대기로
       되돌려, 확정한 액션이 그대로인 채 화면만 "요약 중"이 된다.
  */
  if (!meeting || meeting.aiSummaryStatus !== AI_SUMMARY_STATUS.FAILED) {
    return { ok: false, error: "다시 요약할 수 있는 회의가 아닙니다." };
  }

  setMockSummaryStatus(meetingId, AI_SUMMARY_STATUS.PENDING);
  revalidatePath("/app/meeting");
  return { ok: true };
}
