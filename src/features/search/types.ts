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

/**
 * 목에서만 쓰는 종류별 상세 레코드 — 필터링(`server.ts`의 mock 분기)에 쓴다.
 * ⚠️ **공개 계약이 아니다.** `GET /search`가 실제로 주는 건 훨씬 적은 필드뿐이라
 *    (`SearchResultItem` 참고), 목이든 실서버든 화면에는 그 평평한 모양만 나간다.
 */
export type MockSearchRecord =
  SearchMeetingResult | SearchActionResult | SearchProjectResult | SearchPersonResult;

/**
 * 검색 결과 한 건 — `GET /search`의 `results[]`(`{type, id, title, snippet, project, date,
 * role, score}`)를 그대로 따른다.
 *
 * ⚠️ **종류별 상세 필드가 없다**(담당자 이름·마감일 라벨·회의/액션 건수 등). BE가 종류를 가리지
 *    않는 평평한 모양으로 내려주므로, 화면이 못 받는 값을 지어내지 않는다(§정직성).
 * ⚠️ `project`는 표시용 문구로 **가정**한다 — 필드 shape 미확정(BE 실코드 미대조, §연동 검증).
 */
export interface SearchResultItem {
  kind: SearchKind;
  id: number;
  title: string;
  /** 검색어가 걸린 발췌 — 없으면 `null`(회의 요약이 아직 없는 경우 등) */
  snippet: string | null;
  /** 소속 프로젝트 표시 문구 — 없으면 `null`(사람) */
  project: string | null;
  /** 회의 일시·마감일 등 — 없으면 `null` */
  date: string | null;
  /** 사람의 권한 — `null`이면 배지를 안 그린다(빈 값으로 다룬다) */
  role: Authority | null;
}

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

/**
 * 최근 본 항목 — `SearchResultItem`과 다른, **훨씬 적은** 필드만 온다(`GET /search/overview`).
 * 종류별 상세 필드(발췌·담당자·마감일 등)는 이 API가 안 준다 — `meta`는 BE가 이미 조합한
 * 보조 문구 한 줄이다(예: "프로젝트명 · 날짜").
 */
export interface SearchRecentViewItem {
  kind: SearchKind;
  id: number;
  title: string;
  meta: string | null;
}

/** 검색어가 없을 때(랜딩) 보여줄 것 */
export interface SearchHome {
  /** 최신순 — 최대 10개 */
  recentSearches: string[];
  recentlyViewed: SearchRecentViewItem[];
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
