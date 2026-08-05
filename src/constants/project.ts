/**
 * 프로젝트 상태 — **액션과 같은 셋**이다.
 *
 * ⚠️ `TODO`가 빠져 있었다. `/app/projects` 필터 탭이 할일·진행중·완료 셋인데
 *    상태에 `TODO`가 없으면 첫 탭이 무엇을 거르는지 말할 수 없다.
 * ⚠️ 액션과 값이 같다고 `ActionStatus`를 재사용하지 않는다 — 한쪽 정책이 바뀌면
 *    다른 쪽까지 끌려간다.
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
