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
  /* ⚠️ `대기`가 아니라 **`할 일`**이다(팀 워크플로우 2026-08-05). 보드 첫 열과 같은 말이어야 한다 */
  TODO: "할 일",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

/**
 * 지연 표시 라벨. **상태가 아니라 파생값**(마감 경과)이라 `ACTION_STATUS_LABEL`에 넣지 않는다.
 * 라벨 하드코딩을 막으려고 화면이 `isDelayed`로 판정한 뒤 이 값을 쓴다(§도메인 상수).
 */
export const ACTION_DELAYED_LABEL = "지연";

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
  if (action.status === ACTION_STATUS.DONE) return false;
  // 날짜 전용 값이라 **로컬 자정** 기준으로 비교한다. `new Date("2026-08-05")`는 UTC 자정이라
  // KST(+9)에선 '오늘 마감'이 오전 9시부터 지연으로 잘못 뜬다 — 마감일은 시각이 아니라 날짜다.
  const due = new Date(`${action.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}
