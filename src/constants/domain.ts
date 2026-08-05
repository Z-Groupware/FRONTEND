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
  /* ⚠️ `대기`가 아니라 **`할일`**이다(팀 워크플로우 2026-08-05). 보드 첫 열과 같은 말이어야 한다 */
  TODO: "할일",
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
/**
 * 프로젝트 상태 — **액션과 같은 셋**이다.
 * ⚠️ `TODO`가 빠져 있었다. `/app/projects` 필터 탭이 할일·진행중·완료 셋인데
 *    상태에 `TODO`가 없으면 첫 탭이 무엇을 거르는지 말할 수 없다.
 */
export const PROJECT_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  TODO: "할일",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

/* ───────── 회의 ───────── */
export const MEETING_STATUS = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  /**
   * ⚠️ **미검증.** 한 번 돈 BE 컨벤션 문서가 `COMPLETED`라 맞춰 뒀는데 그 문서는 최신이 아니다
   *    (2026-08-05) — 회의 도메인 담당자 문서로 확인한 뒤 확정한다. 화면 라벨은 `완료`로 같다.
   */
  COMPLETED: "COMPLETED",
} as const;
export type MeetingStatus = (typeof MEETING_STATUS)[keyof typeof MEETING_STATUS];

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  SCHEDULED: "예정",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
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
/**
 * 인수인계 상태.
 *
 * ⚠️ **임시저장이 없다**(2026-08-05 확정). 생성 즉시 팀장에게 상신되고 작성자는 `WAITING`이 된다 —
 *    그래서 `DRAFT`가 없다. 되돌릴 수 없는 흐름이라 생성 창에서 한 번 확인을 받는다.
 * ⚠️ 승인이 **2단계**(팀장 중간 → 오너·Admin 최종)라 상태도 그만큼 필요하다.
 * ⚠️ 값 목록은 **인수인계 도메인 담당자 문서로 확인**해 맞춘다. 반려와 중간 승인을 표현할 수
 *    있어야 한다 — 셋뿐이면 승인 2단계를 담지 못한다.
 */
export const HANDOVER_STATUS = {
  SUBMITTED: "SUBMITTED",
  MID_APPROVED: "MID_APPROVED",
  FINAL_APPROVED: "FINAL_APPROVED",
  REJECTED: "REJECTED",
} as const;
export type HandoverStatus = (typeof HANDOVER_STATUS)[keyof typeof HANDOVER_STATUS];

export const HANDOVER_STATUS_LABEL: Record<HandoverStatus, string> = {
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
/**
 * 회원 상태 — **화면에 보이는 셋이 전부**다(2026-08-05 확정).
 *
 * ⚠️ `WAITING`은 "계정 발급 후 미로그인"이 아니라 **휴직·오프보딩을 신청하고 승인을 기다리는**
 *    상태다. 이름만 보고 온보딩 대기로 읽으면 화면 분기가 틀린다.
 * ⚠️ BE enum과 **이름·값이 같아야 한다**. `ON_LEAVE`처럼 BE가 내부용으로 들고 있는 값은
 *    화면 상태로 쓰지 않는다 — 회원 도메인 담당자 문서로 확인해 맞춘다.
 */
export const MEMBER_STATUS = {
  ACTIVE: "ACTIVE",
  VACATION: "VACATION",
  /** 휴직·오프보딩 신청 후 승인 대기 */
  WAITING: "WAITING",
} as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "재직",
  VACATION: "휴직",
  WAITING: "대기",
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

/* ───────── 공지 (시스템 운영자 발행) ───────── */
/** 공지 발행 대상. SYSTEM 운영자가 어느 기업군에 공지를 뿌릴지 고른다. */
export const NOTICE_TARGET = {
  ALL: "ALL",
  SPECIFIC: "SPECIFIC",
  UNPAID: "UNPAID",
} as const;
export type NoticeTarget = (typeof NOTICE_TARGET)[keyof typeof NOTICE_TARGET];

export const NOTICE_TARGET_LABEL: Record<NoticeTarget, string> = {
  ALL: "전체 기업",
  SPECIFIC: "특정 기업",
  UNPAID: "미납 기업",
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

/** "기업 관리" 목록 정렬 기준 — 규모·플랜 필터를 대신한다(구성원수·가입일 기준). */
export const COMPANY_SORT = {
  MEMBERS_DESC: "MEMBERS_DESC",
  MEMBERS_ASC: "MEMBERS_ASC",
  JOINED_DESC: "JOINED_DESC",
  JOINED_ASC: "JOINED_ASC",
} as const;
export type CompanySort = (typeof COMPANY_SORT)[keyof typeof COMPANY_SORT];

export const COMPANY_SORT_LABEL: Record<CompanySort, string> = {
  MEMBERS_DESC: "구성원 많은순",
  MEMBERS_ASC: "구성원 적은순",
  JOINED_DESC: "최신 가입순",
  JOINED_ASC: "오래된 가입순",
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
