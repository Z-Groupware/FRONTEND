/**
 * 액션 상수 — 화면엔 한글 라벨, 코드엔 영문 상수 (CONVENTIONS §6).
 *
 * ⚠️ 코드값은 **FE 제안**이다. 담당자 도메인 문서를 받으면 여기부터 맞춘다(CLAUDE.md §연동 검증).
 */

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
