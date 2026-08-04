/**
 * 도메인 상수 — 화면엔 한글 라벨, 코드엔 영문 상수 (CONVENTIONS §6).
 *
 * ⚠️ ERD·API 스펙이 아직 없다(BE 협의 전). 여기 코드값은 **FE 제안**이며,
 *    확정되면 이 파일을 가장 먼저 맞춘다. 이후 코드 문자열은 ERD 명칭과 100% 일치시킨다.
 *
 * `enum` 대신 `as const` — 트리셰이킹과 리터럴 타입 추론 때문.
 */

/* ───────── 액션 ───────── */
export const ACTION_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS];

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  TODO: "대기",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

export const ACTION_TYPE = {
  /** 팀 단위 — 팀장이 받아 개인에게 쪼갠다 */
  TEAM: "TEAM",
  /** 개인 — parentActionId로 TEAM을 참조한다 */
  PERSONAL: "PERSONAL",
} as const;
export type ActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE];

/**
 * ⚠️ DELAYED는 **상태가 아니라 파생값**이다(마감 경과).
 * 상태 필드에 넣으면 IN_PROGRESS와 충돌한다 — 항상 계산해서 쓴다.
 */
export function isDelayed(action: { status: ActionStatus; dueDate: string }): boolean {
  return action.status !== ACTION_STATUS.DONE && new Date(action.dueDate) < new Date();
}

/* ───────── 프로젝트 ───────── */
export const PROJECT_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

/* ───────── 회의 ───────── */
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

/* ───────── 인수인계 ───────── */
export const HANDOVER_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  MID_APPROVED: "MID_APPROVED",
  FINAL_APPROVED: "FINAL_APPROVED",
  REJECTED: "REJECTED",
} as const;
export type HandoverStatus = (typeof HANDOVER_STATUS)[keyof typeof HANDOVER_STATUS];

export const HANDOVER_STATUS_LABEL: Record<HandoverStatus, string> = {
  DRAFT: "작성 중",
  SUBMITTED: "전달 완료",
  MID_APPROVED: "중간 승인",
  FINAL_APPROVED: "최종 승인",
  REJECTED: "반려",
};

export const HANDOVER_TYPE = {
  VACATION: "VACATION",
  OFFBOARDING: "OFFBOARDING",
} as const;
export type HandoverType = (typeof HANDOVER_TYPE)[keyof typeof HANDOVER_TYPE];

export const HANDOVER_TYPE_LABEL: Record<HandoverType, string> = {
  VACATION: "휴가",
  // ⚠️ "퇴사" 대체어는 팀 미확정 (DECISIONS.md)
  OFFBOARDING: "오프보딩",
};

/* ───────── 사원 · 역할 ───────── */
export const MEMBER_STATUS = {
  ACTIVE: "ACTIVE",
  ON_LEAVE: "ON_LEAVE",
  /** 계정은 발급됐으나 아직 로그인하지 않음 */
  PENDING: "PENDING",
} as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "재직",
  ON_LEAVE: "휴직",
  PENDING: "대기",
};

/*
  역할·겸직 권한 상수는 `role.ts`로 옮겼다. 쓰던 곳이 많아 여기서 그대로 다시 내보낸다.
  새로 쓰는 코드는 `@/constants/role`에서 직접 가져와도 된다.
*/
export {
  ADMIN_ELIGIBLE_ROLES,
  ADMIN_LABEL,
  ADMIN_SCOPE_LABEL,
  ASSIGNABLE_ROLES,
  POSITION_ROLES,
  ROLE,
  type Role,
  ROLE_LABEL,
  ROLE_SCOPE_LABEL,
} from "./role";

/* ───────── AI 파이프라인 (시스템 모니터링) ───────── */
/**
 * 회의 캡처 → 액션 하달까지의 처리 단계. SYSTEM 운영자가 큐·실패를 이 단계 기준으로 본다.
 * ⚠️ STT(자막 변환)는 브라우저 기능이지만, 여기 단계는 **서버 파이프라인의 재처리 단위**라
 *    별개다 — 운영자가 실패를 재처리하는 대상은 서버 잡이다(CLAUDE.md §AI: STT 표기 주의).
 */
export const PIPELINE_STAGE = {
  UPLOAD: "UPLOAD",
  TRANSCRIBE: "TRANSCRIBE",
  SUMMARIZE: "SUMMARIZE",
  EXTRACT_ACTION: "EXTRACT_ACTION",
} as const;
export type PipelineStage = (typeof PIPELINE_STAGE)[keyof typeof PIPELINE_STAGE];

export const PIPELINE_STAGE_LABEL: Record<PipelineStage, string> = {
  UPLOAD: "업로드",
  TRANSCRIBE: "자막 변환",
  SUMMARIZE: "요약 생성",
  EXTRACT_ACTION: "액션 추출",
};

/* ───────── 구독 · 기업 ───────── */
export const PLAN = { FREE: "FREE", TEAM: "TEAM" } as const;
export type Plan = (typeof PLAN)[keyof typeof PLAN];

/** 요금제명은 영문을 그대로 쓴다(역할 워딩과 같은 이유). */
export const PLAN_LABEL: Record<Plan, string> = {
  FREE: "Free",
  TEAM: "Team",
};

export const PAYMENT_STATUS = {
  PAID: "PAID",
  UNPAID: "UNPAID",
  CANCELED: "CANCELED",
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PAID: "완료",
  UNPAID: "미납",
  CANCELED: "해지",
};

/** 시스템(운영자)이 보는 기업 상태 */
export const COMPANY_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  UNPAID: "UNPAID",
} as const;
export type CompanyStatus = (typeof COMPANY_STATUS)[keyof typeof COMPANY_STATUS];

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  ACTIVE: "활성",
  SUSPENDED: "정지",
  UNPAID: "미납",
};

/** 기업 가입 신청서의 직원 규모 구간. */
export const COMPANY_SIZE = {
  MICRO: "MICRO",
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
} as const;
export type CompanySize = (typeof COMPANY_SIZE)[keyof typeof COMPANY_SIZE];

export const COMPANY_SIZE_LABEL: Record<CompanySize, string> = {
  MICRO: "5명 이하",
  SMALL: "6~20명",
  MEDIUM: "21~100명",
  LARGE: "101명 이상",
};
