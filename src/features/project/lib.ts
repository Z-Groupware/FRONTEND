import {
  DEFAULT_PROJECT_SORT,
  PROJECT_SORT,
  PROJECT_STATUS,
  PROJECT_STATUS_LABEL,
  type ProjectSort,
  type ProjectStatus,
} from "@/constants/domain";

import type { ProjectListItem } from "./types";

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

/** URL의 `?sort=` 값을 안전하게 정렬 기준으로 — 모르는 값이면 기본(마감 임박순). */
export function parseProjectSort(value: string | undefined): ProjectSort {
  return Object.values(PROJECT_SORT).find((sort) => sort === value) ?? DEFAULT_PROJECT_SORT;
}

/** 정렬 적용(불변) — 서버가 목록에 얹는다. 순수 함수라 그대로 테스트한다. */
export function sortProjects(list: ProjectListItem[], sort: ProjectSort): ProjectListItem[] {
  const sorted = [...list];
  switch (sort) {
    case PROJECT_SORT.NAME:
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    case PROJECT_SORT.DUE_ASC:
    default:
      return sorted.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
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

/** 프로젝트 상세(`/app/projects/:projectId`) 탭 — 값이 곧 `?tab=` 값이다(기획은 기본이라 쿼리에 안 실린다). */
export const PROJECT_DETAIL_TABS = [
  { tab: "plan", label: "기획" },
  { tab: "timeline", label: "타임라인" },
] as const;

export type ProjectDetailTab = (typeof PROJECT_DETAIL_TABS)[number]["tab"];

/** URL의 `?tab=` 값을 안전하게 탭으로 — 모르는 값이면 기본(기획). */
export function parseProjectDetailTab(value: string | undefined): ProjectDetailTab {
  return PROJECT_DETAIL_TABS.find((t) => t.tab === value)?.tab ?? "plan";
}

/**
 * 타임라인 탭 박스 높이 — 사원 대시보드의 `DUE_SOON_BOX_MIN_HEIGHT`(280)와 같은 컴포넌트를
 * 재사용하되, 여기는 다른 섹션과 경합하지 않는 전용 화면이라 더 크게 둔다.
 */
export const PROJECT_TIMELINE_BOX_HEIGHT = 480;
