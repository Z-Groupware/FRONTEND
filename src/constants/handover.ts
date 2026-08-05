/**
 * 인수인계 상수.
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
