/**
 * BE shape → UI 계약(§Mock 격리막). 컴포넌트는 이 파일을 모른다 — `server.ts`만 쓴다.
 * [확인] D도메인 REST API 명세(2026-08-12) 대조.
 */

import type { PendingReviewSummary } from "./types";

/**
 * `GET /api/meetings/pending-action-distributions`(MEET-10, 구현 완료) 목록 원소.
 * ⚠️ `status`·`startAt`·`project`도 오지만 마이페이지 위젯(회의 제목·액션 건수만 표시)은
 *    안 쓴다 — 안 쓰는 필드는 적지 않는다(`BeMeetingDetail`과 같은 원칙).
 */
export interface BePendingActionDistributionMeeting {
  meetingId: number;
  title: string;
  status: string;
  startAt: string;
  pendingActionCount: number;
  project: { projectId: number; tag: string; name: string };
}

export interface BePendingActionDistributionsResponse {
  meetings: BePendingActionDistributionMeeting[];
}

/**
 * 마이페이지 "미확정 액션" 목록이 받는 모양으로 바꾼다.
 * ⚠️ `meetingId`는 BE가 숫자로 주지만 화면 계약은 문자열이다(다른 회의 id와 동일 규칙).
 */
export function toPendingReviewSummary(
  be: BePendingActionDistributionMeeting,
): PendingReviewSummary {
  return {
    meetingId: String(be.meetingId),
    meetingTitle: be.title,
    actionCount: be.pendingActionCount,
  };
}
