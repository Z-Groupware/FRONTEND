/**
 * BE shape → UI 계약(§Mock 격리막). 컴포넌트는 이 파일을 모른다 — `server.ts`만 쓴다.
 * [확인] D도메인 REST API 명세(2026-08-12) 대조.
 */

import type { StalledSummaryInfo } from "./types";

/**
 * `GET /api/meetings/stalled-summaries`(MEET-15, 구현 완료) 목록 원소.
 * ⚠️ `isStalled`는 D가 만들지 않는다 — 요약 파이프라인을 가진 A가 갖고 있는 값을 그대로 싣는다.
 */
export interface BeStalledSummaryMeeting {
  meetingId: number;
  title: string;
  isStalled: boolean;
}

export interface BeStalledSummariesResponse {
  meetings: BeStalledSummaryMeeting[];
  page: { page: number; size: number; totalElements: number; totalPages: number };
}

/**
 * 마이페이지 "요약이 중단된 회의" 목록이 받는 모양으로 바꾼다.
 * ⚠️ `meetingId`는 BE가 숫자로 주지만 화면 계약은 문자열이다(다른 회의 id와 동일 규칙).
 */
export function toStalledSummaryInfo(be: BeStalledSummaryMeeting): StalledSummaryInfo {
  return {
    meetingId: String(be.meetingId),
    meetingTitle: be.title,
    isStalled: be.isStalled,
  };
}
