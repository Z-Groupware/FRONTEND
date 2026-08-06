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
 * 회의 주제 대분류 — 회의실 예약 폼의 "회의 주제"(대주제→소주제) 선택에 쓴다.
 * ⚠️ 미확정 목업이다 — 회의 도메인 담당자 문서를 받으면 이 파일부터 맞춘다(CLAUDE.md §연동 검증).
 */
export const MEETING_TOPIC_MAIN = {
  PRODUCT: "PRODUCT",
  MARKETING: "MARKETING",
  INFRA: "INFRA",
  TEAM: "TEAM",
} as const;
export type MeetingTopicMain = (typeof MEETING_TOPIC_MAIN)[keyof typeof MEETING_TOPIC_MAIN];

export const MEETING_TOPIC_MAIN_LABEL: Record<MeetingTopicMain, string> = {
  PRODUCT: "제품",
  MARKETING: "마케팅",
  INFRA: "인프라",
  TEAM: "팀 운영",
};

export interface MeetingTopicSub {
  value: string;
  label: string;
}

/** 대주제별 소주제 목록 — 대주제를 고르면 이 목록으로 소주제 select가 갈린다. */
export const MEETING_TOPIC_SUB: Record<MeetingTopicMain, MeetingTopicSub[]> = {
  PRODUCT: [
    { value: "ROADMAP_REVIEW", label: "로드맵 검토" },
    { value: "FEATURE_PLANNING", label: "기능 기획" },
  ],
  MARKETING: [
    { value: "CHANNEL_STRATEGY", label: "채널 전략" },
    { value: "CAMPAIGN_REVIEW", label: "캠페인 리뷰" },
  ],
  INFRA: [
    { value: "MIGRATION_REVIEW", label: "마이그레이션 리뷰" },
    { value: "INCIDENT_RETRO", label: "장애 회고" },
  ],
  TEAM: [
    { value: "WEEKLY_SYNC", label: "위클리 싱크" },
    { value: "ONE_ON_ONE", label: "1:1" },
  ],
};
