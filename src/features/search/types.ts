import type { Authority } from "@/constants/domain";

/**
 * 검색 — 격리막의 UI 계약(CLAUDE.md §Mock 격리막).
 * 컴포넌트는 이 타입만 알고, 목/실서버 분기는 `server.ts`가 끝낸다.
 */

export const SEARCH_KIND = {
  MEETING: "MEETING",
  ACTION: "ACTION",
  PROJECT: "PROJECT",
  PERSON: "PERSON",
} as const;
export type SearchKind = (typeof SEARCH_KIND)[keyof typeof SEARCH_KIND];

export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  MEETING: "회의",
  ACTION: "액션",
  PROJECT: "프로젝트",
  PERSON: "사람",
};

export interface SearchMeetingResult {
  kind: "MEETING";
  id: number;
  title: string;
  /** 검색어가 걸린 자리를 보여주는 발췌 — 요약의 한 조각 */
  snippet: string;
  projectName: string;
  projectTag: string;
  /** `YYYY-MM-DD` */
  meetingDate: string;
}

export interface SearchActionResult {
  kind: "ACTION";
  id: number;
  title: string;
  assigneeId: number;
  assigneeName: string;
  /** `YYYY-MM-DD` */
  dueDate: string;
  projectTag: string;
}

export interface SearchProjectResult {
  kind: "PROJECT";
  id: number;
  name: string;
  tag: string;
  meetingCount: number;
  actionCount: number;
}

export interface SearchPersonResult {
  kind: "PERSON";
  id: number;
  name: string;
  authority: Authority;
  team: string | null;
  /** 그 사람을 설명하는 한 줄 — 최근 담당한 일 */
  description: string;
}

export type SearchResultItem =
  SearchMeetingResult | SearchActionResult | SearchProjectResult | SearchPersonResult;

export interface SearchCategoryCounts {
  total: number;
  meeting: number;
  action: number;
  project: number;
  person: number;
}

/** 검색 결과 화면이 한 번에 받는 것 */
export interface SearchResults {
  keyword: string;
  /**
   * 탭 숫자용 건수 — **프로젝트·기간 필터는 반영하고 카테고리(탭)만 무시하고** 센다.
   * 그래서 탭을 눌러도 숫자 자체는 안 흔들리지만, 프로젝트·기간을 바꾸면 같이 바뀐다.
   */
  counts: SearchCategoryCounts;
  /** 지금 고른 탭·필터로 걸러진 목록 */
  items: SearchResultItem[];
}

export interface RecentSearchEntry {
  keyword: string;
  /** ISO datetime */
  searchedAt: string;
}

export interface ProjectBrowseItem {
  id: number;
  name: string;
  tag: string;
  meetingCount: number;
}

export interface PersonBrowseItem {
  id: number;
  name: string;
  authority: Authority;
}

/** 검색어가 없을 때(랜딩) 보여줄 것 */
export interface SearchHome {
  recentSearches: RecentSearchEntry[];
  recentlyViewed: SearchResultItem[];
  projects: ProjectBrowseItem[];
  people: PersonBrowseItem[];
}

export const SEARCH_CATEGORY = {
  ALL: "all",
  MEETING: "meeting",
  ACTION: "action",
  PROJECT: "project",
  PERSON: "person",
} as const;
export type SearchCategory = (typeof SEARCH_CATEGORY)[keyof typeof SEARCH_CATEGORY];

export const SEARCH_CATEGORY_LABEL: Record<SearchCategory, string> = {
  all: "전체",
  meeting: "회의",
  action: "액션",
  project: "프로젝트",
  person: "사람",
};

export const SEARCH_PERIOD = {
  ALL: "all",
  WEEK: "7d",
  MONTH: "30d",
  QUARTER: "90d",
} as const;
export type SearchPeriod = (typeof SEARCH_PERIOD)[keyof typeof SEARCH_PERIOD];

export const SEARCH_PERIOD_LABEL: Record<SearchPeriod, string> = {
  all: "전체 기간",
  "7d": "최근 7일",
  "30d": "최근 30일",
  "90d": "최근 3개월",
};

/** 검색 화면이 주소(`searchParams`)에서 읽는 조건 전부 */
export interface SearchQuery {
  keyword: string;
  category: SearchCategory;
  /** `null` = 전체 프로젝트 */
  projectTag: string | null;
  period: SearchPeriod;
}
