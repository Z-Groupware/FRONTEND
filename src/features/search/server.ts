import "server-only";

import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";
import { todayIso } from "@/lib/date";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { categoryOf, textIncludes } from "./lib";
import type { BeSearchOverview, BeSearchResponse } from "./mapper";
import {
  toPersonBrowseItem,
  toProjectBrowseItem,
  toRecentViewItems,
  toSearchResults,
} from "./mapper";
import {
  SEARCH_MOCK_ACTIONS,
  SEARCH_MOCK_MEETINGS,
  SEARCH_MOCK_PEOPLE,
  SEARCH_MOCK_PROJECTS,
  SEARCH_MOCK_RECENTLY_VIEWED,
} from "./mock/data";
import { listMockRecentSearches } from "./mock/recent-searches";
import type {
  MockSearchRecord,
  ProjectBrowseItem,
  SearchCategory,
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
function isoToUtcMs(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match;
  const yNum = Number(y);
  const mNum = Number(m);
  const dNum = Number(d);
  const ms = Date.UTC(yNum, mNum - 1, dNum);
  const date = new Date(ms);
  if (
    date.getUTCFullYear() !== yNum ||
    date.getUTCMonth() !== mNum - 1 ||
    date.getUTCDate() !== dNum
  ) {
    return null;
  }
  return ms;
}

function withinPeriod(iso: string, days: number | null, todayIsoValue: string): boolean {
  if (days === null) return true;
  const target = isoToUtcMs(iso);
  const today = isoToUtcMs(todayIsoValue);
  if (target === null || today === null) return false;
  const diffDays = (today - target) / 86_400_000;
  return diffDays >= 0 && diffDays <= days;
}

const PERIOD_DAYS: Record<SearchQuery["period"], number | null> = {
  all: null,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function matchesKeyword(item: MockSearchRecord, keyword: string): boolean {
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

function matchesProject(item: MockSearchRecord, projectTag: string | null): boolean {
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
  item: MockSearchRecord,
  period: SearchQuery["period"],
  todayIsoValue: string,
): boolean {
  const days = PERIOD_DAYS[period];
  if (item.kind === "MEETING") return withinPeriod(item.meetingDate, days, todayIsoValue);
  if (item.kind === "ACTION") return withinPeriod(item.dueDate, days, todayIsoValue);
  return true;
}

function allMockRecords(): MockSearchRecord[] {
  return [
    ...SEARCH_MOCK_MEETINGS,
    ...SEARCH_MOCK_ACTIONS,
    ...SEARCH_MOCK_PROJECTS,
    ...SEARCH_MOCK_PEOPLE,
  ];
}

/**
 * 목의 종류별 상세 레코드 → 실서버와 같은 평평한 결과 모양.
 * ⚠️ 실서버(`GET /search`)가 종류별 상세 필드(담당자·회의/액션 건수 등)를 안 주므로,
 *    목도 **같은 만큼만** 보여준다 — 목이 실서버보다 더 자세하면 연동 전후 화면이 달라진다.
 */
function toSearchResultItem(record: MockSearchRecord): SearchResultItem {
  switch (record.kind) {
    case "MEETING":
      return {
        kind: "MEETING",
        id: record.id,
        title: record.title,
        snippet: record.snippet,
        /*
          ⚠️ **태그다**(2026-08-13 고침 — 전에는 `projectName`이었다). 실서버 매퍼가 BE의
             `project` 객체에서 `tag`를 꺼내 쓰는데(§search/mapper) 목만 이름을 넣고 있어,
             **같은 줄이 목과 실서버에서 다른 값을 보여줬다.**
          ⚠️ 이름이 아니라 태그로 맞춘 이유: 이 값이 결과 줄의 **팔레트 키**로도 쓰여
             (`pickPaletteColor`) 앱의 다른 화면(보드·회의 카드)과 같은 키여야 같은
             프로젝트가 같은 색으로 나온다(§컴포넌트 위생).
        */
        project: record.projectTag,
        date: record.meetingDate,
        role: null,
      };
    case "ACTION":
      return {
        kind: "ACTION",
        id: record.id,
        title: record.title,
        snippet: null,
        /* 액션도 프로젝트에 매여 있다 — 회의와 같은 자리에 같은 값(태그)을 채운다 */
        project: record.projectTag,
        date: record.dueDate,
        role: null,
      };
    case "PROJECT":
      return {
        kind: "PROJECT",
        id: record.id,
        title: record.name,
        snippet: null,
        project: null,
        date: null,
        role: null,
      };
    case "PERSON":
      return {
        kind: "PERSON",
        id: record.id,
        title: record.name,
        snippet: record.description,
        project: null,
        date: null,
        role: record.authority,
      };
  }
}

const BE_SEARCH_TYPE: Record<SearchCategory, string> = {
  all: "ALL",
  meeting: "MEETING",
  action: "ACTION",
  project: "PROJECT",
  person: "PERSON",
};

/** 오늘 기준 `days`일 전 — `Date.UTC`로만 셈해 시간대에 안 흔들린다(`lib/date.ts`와 같은 방식) */
function isoDaysBefore(to: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(to);
  if (!match) return to;

  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d) - days)).toISOString().slice(0, 10);
}

/** 기간 프리셋 → `from`/`to` — "전체 기간"은 둘 다 안 보낸다 */
function toDateRange(period: SearchQuery["period"]): { from: string | null; to: string | null } {
  const days = PERIOD_DAYS[period];
  if (days === null) return { from: null, to: null };
  const to = todayIso();
  return { from: isoDaysBefore(to, days), to };
}

/** 검색 결과 — 카테고리 탭 숫자는 키워드·프로젝트·기간까지 반영해 센다(탭을 눌러도 숫자가 안 흔들리게). */
export async function getSearchResults(query: SearchQuery): Promise<SearchResults> {
  const keyword = query.keyword.trim();

  if (!keyword) {
    return {
      keyword,
      counts: { total: 0, meeting: 0, action: 0, project: 0, person: 0 },
      items: [],
    };
  }

  if (isMock) {
    const today = todayIso();
    const matched = allMockRecords().filter(
      (item) =>
        matchesKeyword(item, keyword) &&
        matchesProject(item, query.projectTag) &&
        matchesPeriod(item, query.period, today),
    );

    const counts = matched.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[categoryOf(item)] += 1;
        return acc;
      },
      { total: 0, meeting: 0, action: 0, project: 0, person: 0 },
    );

    const items = (
      query.category === "all"
        ? matched
        : matched.filter((item) => categoryOf(item) === query.category)
    ).map(toSearchResultItem);

    return { keyword, counts, items };
  }

  /*
    [스펙 전달, BE 실코드 미대조] `GET /api/v1/search` — 탭 숫자(`counts`)는 카테고리(`type`)만
    빼고 지금 건 프로젝트·기간 필터를 반영해 서버가 센다(우리 mock과 같은 규칙). 정렬도
    서버가 정한 순서를 그대로 쓴다 — 여기서 다시 정렬하지 않는다.
  */
  const accessToken = await requireAccessToken();
  const { from, to } = toDateRange(query.period);
  const params = new URLSearchParams({ q: keyword, type: BE_SEARCH_TYPE[query.category] });
  if (query.projectTag) params.append("tags", query.projectTag);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const response = await serverApi<BeSearchResponse>(`${ep.search()}?${params}`, { accessToken });
  return toSearchResults(response);
}
