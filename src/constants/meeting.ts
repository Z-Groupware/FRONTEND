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

/**
 * AI 액션 분배 리뷰 화면(`/app/meeting/:id/review`)의 확신도 구분 — 표시 차이일 뿐
 * 둘 다 전부 수정 가능하다(WORKFLOW.md §3-4 "두 그룹은 시각적 구분(라벨)일 뿐, 수정은 전부
 * 가능(A안)"). ⚠️ 구분은 **색이 아니라 아이콘**으로 한다(DESIGN.md §5 — 상태점 외 색 금지).
 */
export const AI_CONFIDENCE = {
  HIGH: "HIGH",
  NEEDS_REVIEW: "NEEDS_REVIEW",
} as const;
export type AiConfidence = (typeof AI_CONFIDENCE)[keyof typeof AI_CONFIDENCE];

export const AI_CONFIDENCE_LABEL: Record<AiConfidence, string> = {
  HIGH: "AI 확신도 높음",
  // ⚠️ "AI 확인 필요"에서 정정(2026-08-07 사용자 확정) — WORKFLOW.md §3-4 문구도 같이 갱신.
  NEEDS_REVIEW: "AI 요약 불확실",
};

/**
 * 액션 분배 리뷰에서 ✕(반려) 클릭 시 고르는 사유 3택(WORKFLOW.md §3-4).
 * 담당자·날짜만 고친 경우는 사유가 필요 없다 — ✕로 제외할 때만 고른다.
 */
export const ACTION_REJECT_REASON = {
  HALLUCINATION: "HALLUCINATION",
  NOT_CONFIRMED: "NOT_CONFIRMED",
  DUPLICATE: "DUPLICATE",
} as const;
export type ActionRejectReason = (typeof ACTION_REJECT_REASON)[keyof typeof ACTION_REJECT_REASON];

export const ACTION_REJECT_REASON_LABEL: Record<ActionRejectReason, string> = {
  HALLUCINATION: "그런 말을 한 적 없음",
  NOT_CONFIRMED: "논의였는데 확정으로 잘못 인식됨",
  DUPLICATE: "다른 액션과 중복",
};

/*
  ⚠️ 회의 주제(대주제/소주제) 고정 enum은 여기 없다(2026-08-07 제거) — WORKFLOW.md §3-1
     확정: "대주제 1개+소주제 1개 필수, 나머지는 추가/삭제 버튼으로 늘리고 줄이는" **자유 입력
     텍스트**다. 타입은 `features/rooms/types.ts`의 `MeetingTopicInput`(자유 텍스트 쌍)을 본다.
*/
