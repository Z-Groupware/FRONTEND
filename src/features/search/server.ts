import "server-only";

import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { categoryOf, textIncludes } from "./lib";
import type { BeSearchOverview } from "./mapper";
import { toPersonBrowseItem, toProjectBrowseItem, toRecentViewItems } from "./mapper";
import {
  SEARCH_MOCK_ACTIONS,
  SEARCH_MOCK_MEETINGS,
  SEARCH_MOCK_PEOPLE,
  SEARCH_MOCK_PROJECTS,
  SEARCH_MOCK_RECENTLY_VIEWED,
} from "./mock/data";
import { listMockRecentSearches } from "./mock/recent-searches";
import type {
  ProjectBrowseItem,
  SearchHome,
  SearchQuery,
  SearchResultItem,
  SearchResults,
} from "./types";

/** 검색 — 격리막(CLAUDE.md). 연동할 때 고칠 곳은 이 파일과 매퍼뿐이고 컴포넌트는 건드리지 않는다. */

function mapProjectsForBrowse(): ProjectBrowseItem[] {
  return SEARCH_MOCK_PROJECTS.map((project) => ({
    id: project.id,
    name: project.name,
    tag: project.tag,
    meetingCount: project.meetingCount,
  }));
}

/** 검색어가 없을 때(랜딩)의 화면 — 최근 검색어·최근 본 항목·둘러보기 목록 */
export async function getSearchHome(): Promise<SearchHome> {
  if (isMock) {
    return {
      recentSearches: listMockRecentSearches(),
      recentlyViewed: SEARCH_MOCK_RECENTLY_VIEWED,
      projects: mapProjectsForBrowse(),
      people: SEARCH_MOCK_PEOPLE.map((person) => ({
        id: person.id,
        name: person.name,
        authority: person.authority,
      })),
    };
  }

  /*
    [스펙 전달, BE 실코드 미대조] `GET /api/v1/search/overview` — 최근 검색어·최근 본 항목·
    둘러보기용 프로젝트·사람 목록을 한 번에 준다. 회사·사람은 토큰 기준으로 서버가 정한다.
  */
  const accessToken = await requireAccessToken();
  const overview = await serverApi<BeSearchOverview>(ep.searchOverview(), { accessToken });

  return {
    recentSearches: overview.recentQueries,
    recentlyViewed: toRecentViewItems(overview.recentItems),
    projects: overview.projects.map(toProjectBrowseItem),
    people: overview.people.map(toPersonBrowseItem),
  };
}

/**
 * 결과 화면의 프로젝트 필터 목록.
 *
 * ⚠️ **`getSearchHome()`을 대신 쓰지 않는다.** 그건 최근 검색어·최근 본 항목까지 같이 불러오는
 *    랜딩 전용 조회라, 검색어가 있는 화면(결과 목록)에서 그걸 불러오면 랜딩 쪽 API가 실패했을 때
 *    결과 화면까지 같이 죽는다 — 결과 화면이 실제로 필요한 건 필터용 프로젝트 목록뿐이다.
 */
export async function getSearchProjects(): Promise<ProjectBrowseItem[]> {
  if (isMock) return mapProjectsForBrowse();

  // ⚠️ 미구현 — API 스펙 확정 후 프로젝트 목록 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("검색 필터용 프로젝트 목록 API가 아직 연결되지 않았습니다.");
}

/**
 * 마감·회의 일시가 이 기간 **안**에 드는지 — 기간이 없는 값(프로젝트·사람)은 항상 통과시킨다.
 * ⚠️ **미래 날짜는 포함하지 않는다.** "최근 N일"은 지난 일을 묻는 말이라, 아직 안 지난
 *    마감일까지 걸리면 "최근"이라는 말과 어긋난다.
 */
function withinPeriod(iso: string, days: number | null, todayMs: number): boolean {
  if (days === null) return true;
  const target = new Date(`${iso}T00:00:00`).getTime();
  const diffDays = (todayMs - target) / 86_400_000;
  return diffDays >= 0 && diffDays <= days;
}

const PERIOD_DAYS: Record<SearchQuery["period"], number | null> = {
  all: null,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function matchesKeyword(item: SearchResultItem, keyword: string): boolean {
  switch (item.kind) {
    case "MEETING":
      return textIncludes(item.title, keyword) || textIncludes(item.snippet, keyword);
    case "ACTION":
      return textIncludes(item.title, keyword) || textIncludes(item.assigneeName, keyword);
    case "PROJECT":
      // ⚠️ 태그는 안 찾는다 — 화면에 안 내보내는 내부 식별자라(CLAUDE.md §도메인 상수),
      //    태그로만 걸리면 사용자는 왜 이 프로젝트가 떴는지 알 길이 없다.
      return textIncludes(item.name, keyword);
    case "PERSON":
      return (
        textIncludes(item.name, keyword) ||
        textIncludes(item.description, keyword) ||
        (item.team !== null && textIncludes(item.team, keyword))
      );
  }
}

function matchesProject(item: SearchResultItem, projectTag: string | null): boolean {
  if (!projectTag) return true;
  switch (item.kind) {
    case "MEETING":
    case "ACTION":
      return item.projectTag === projectTag;
    case "PROJECT":
      return item.tag === projectTag;
    case "PERSON":
      // 사람은 특정 프로젝트에 속하지 않는다 — 프로젝트 필터를 걸어도 그대로 둔다
      return true;
  }
}

function matchesPeriod(
  item: SearchResultItem,
  period: SearchQuery["period"],
  todayMs: number,
): boolean {
  const days = PERIOD_DAYS[period];
  if (item.kind === "MEETING") return withinPeriod(item.meetingDate, days, todayMs);
  if (item.kind === "ACTION") return withinPeriod(item.dueDate, days, todayMs);
  return true;
}

function allItems(): SearchResultItem[] {
  return [
    ...SEARCH_MOCK_MEETINGS,
    ...SEARCH_MOCK_ACTIONS,
    ...SEARCH_MOCK_PROJECTS,
    ...SEARCH_MOCK_PEOPLE,
  ];
}

/** 검색 결과 — 카테고리 탭 숫자는 키워드·프로젝트·기간까지 반영해 센다(탭을 눌러도 숫자가 안 흔들리게). */
export async function getSearchResults(query: SearchQuery): Promise<SearchResults> {
  const keyword = query.keyword.trim();

  if (!isMock) {
    // ⚠️ 미구현 — API 스펙 확정 후 검색 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
    throw new Error("검색 API가 아직 연결되지 않았습니다.");
  }

  if (!keyword) {
    return {
      keyword,
      counts: { total: 0, meeting: 0, action: 0, project: 0, person: 0 },
      items: [],
    };
  }

  const todayMs = Date.now();
  const matched = allItems().filter(
    (item) =>
      matchesKeyword(item, keyword) &&
      matchesProject(item, query.projectTag) &&
      matchesPeriod(item, query.period, todayMs),
  );

  const counts = matched.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[categoryOf(item)] += 1;
      return acc;
    },
    { total: 0, meeting: 0, action: 0, project: 0, person: 0 },
  );

  const items =
    query.category === "all"
      ? matched
      : matched.filter((item) => categoryOf(item) === query.category);

  return { keyword, counts, items };
}
