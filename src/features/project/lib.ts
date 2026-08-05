import { PROJECT_STATUS, PROJECT_STATUS_LABEL, type ProjectStatus } from "@/constants/domain";

/** 목록 위에 오는 상태 필터 탭 — 값·라벨은 도메인 상수에서 온다(라벨 하드코딩 금지). */
export const PROJECT_FILTER_TABS: { status: ProjectStatus; label: string }[] = [
  { status: PROJECT_STATUS.TODO, label: PROJECT_STATUS_LABEL[PROJECT_STATUS.TODO] },
  { status: PROJECT_STATUS.IN_PROGRESS, label: PROJECT_STATUS_LABEL[PROJECT_STATUS.IN_PROGRESS] },
  { status: PROJECT_STATUS.DONE, label: PROJECT_STATUS_LABEL[PROJECT_STATUS.DONE] },
];

/** 기본 탭 — 피그마에서 활성인 '진행중'. */
export const DEFAULT_PROJECT_STATUS: ProjectStatus = PROJECT_STATUS.IN_PROGRESS;

/** 담당 부서 라벨을 몇 개까지 노출하는지 — 나머지는 `+N`. */
export const MAX_VISIBLE_DEPARTMENTS = 2;

/** URL의 `?status=` 값을 안전하게 상태로 — 모르는 값이면 기본 탭. */
export function parseProjectStatus(value: string | undefined): ProjectStatus {
  return PROJECT_FILTER_TABS.find((tab) => tab.status === value)?.status ?? DEFAULT_PROJECT_STATUS;
}

/** 진척율(%) — 액션이 없으면 0. 파생값이라 저장하지 않고 계산한다. */
export function getProgressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

/** 부서 라벨을 노출분/초과수로 가른다. `{ visible: ["개발팀","마케팅팀"], overflow: 1 }`. */
export function splitDepartments(
  departments: string[],
  max = MAX_VISIBLE_DEPARTMENTS,
): { visible: string[]; overflow: number } {
  return { visible: departments.slice(0, max), overflow: Math.max(0, departments.length - max) };
}
