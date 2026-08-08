import "server-only";

import { isMock } from "@/mocks/config";

import { categoryOf, textIncludes } from "./lib";
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

/** 검색어가 없을 때(랜딩)의 화면 — 최근 검색어·최근 본 항목·둘러보기 목록 */
export async function getSearchHome(): Promise<SearchHome> {
  if (isMock) {
    return {
      recentSearches: listMockRecentSearches(),
      recentlyViewed: SEARCH_MOCK_RECENTLY_VIEWED,
      projects: SEARCH_MOCK_PROJECTS.map((project): ProjectBrowseItem => ({
        id: project.id,
        name: project.name,
        tag: project.tag,
        meetingCount: project.meetingCount,
      })),
      people: SEARCH_MOCK_PEOPLE.map((person) => ({
        id: person.id,
        name: person.name,
        authority: person.authority,
      })),
    };
  }

  // ⚠️ 미구현 — API 스펙 확정 후 검색 랜딩 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("검색 랜딩 API가 아직 연결되지 않았습니다.");
}

/** 마감·회의 일시가 이 기간 안에 드는지 — 기간이 없는 값(프로젝트·사람)은 항상 통과시킨다 */
function withinPeriod(iso: string, days: number | null, todayMs: number): boolean {
  if (days === null) return true;
  const target = new Date(`${iso}T00:00:00`).getTime();
  const diffDays = (todayMs - target) / 86_400_000;
  return diffDays >= -days && diffDays <= days;
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
      return textIncludes(item.name, keyword) || textIncludes(item.tag, keyword);
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
