/**
 * 회의 · 캡처 · AI 요약 상수.
 *
 * ⚠️ 코드값은 **FE 제안**이다. 회의 도메인 담당자 문서를 받으면 여기부터 맞춘다
 *    (CLAUDE.md §연동 검증).
 */

export const MEETING_STATUS = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type MeetingStatus = (typeof MEETING_STATUS)[keyof typeof MEETING_STATUS];

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  SCHEDULED: "예정",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

/** 캡처 세션 — 담당자만 조작 가능(권한 2축, lib/permission.ts) */
export const CAPTURE_STATUS = {
  IDLE: "IDLE",
  RECORDING: "RECORDING",
  SUBMITTING: "SUBMITTING",
  DONE: "DONE",
} as const;
export type CaptureStatus = (typeof CAPTURE_STATUS)[keyof typeof CAPTURE_STATUS];

/**
 * ⚠️ `REVIEWED`와 `DISTRIBUTED`는 다른 단계다. 요약은 **초안**까지이고,
 *    실제 액션은 검토 화면에서 [액션 분배 확정]을 눌러야 생긴다(CLAUDE.md §브라우저 API).
 */
export const AI_SUMMARY_STATUS = {
  PENDING: "PENDING",
  SUMMARIZING: "SUMMARIZING",
  REVIEWED: "REVIEWED",
  DISTRIBUTED: "DISTRIBUTED",
} as const;
export type AiSummaryStatus = (typeof AI_SUMMARY_STATUS)[keyof typeof AI_SUMMARY_STATUS];

export const AI_SUMMARY_STATUS_LABEL: Record<AiSummaryStatus, string> = {
  PENDING: "대기",
  SUMMARIZING: "요약 중",
  REVIEWED: "검토 완료",
  DISTRIBUTED: "분배 완료",
};

export const MEETING_INVITE_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
export type MeetingInviteStatus =
  (typeof MEETING_INVITE_STATUS)[keyof typeof MEETING_INVITE_STATUS];

export const MEETING_INVITE_STATUS_LABEL: Record<MeetingInviteStatus, string> = {
  PENDING: "미응답",
  ACCEPTED: "참석",
  DECLINED: "불참",
};
