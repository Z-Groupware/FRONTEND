import { AUTHORITY, type Authority } from "@/constants/domain";

import type {
  PersonBrowseItem,
  ProjectBrowseItem,
  SearchRecentViewItem,
  SearchResultItem,
  SearchResults,
} from "./types";
import { SEARCH_KIND, type SearchKind } from "./types";

/**
 * BE shape → UI 계약 (§Mock 격리막 — **shape을 흡수하는 곳은 여기 하나다**).
 *
 * ⚠️ 컴포넌트는 이 파일을 모른다. BE가 모양을 바꾸면 여기만 고친다.
 * ⚠️ API 스펙 전달받음(2026-08-11) — **BE 실코드 미대조**(§연동 검증).
 */

export interface BeSearchOverview {
  recentQueries: string[];
  recentItems: { type: string; id: number; title: string; meta: string | null }[];
  projects: { id: number; tag: string; name: string; meetingCount: number }[];
  people: { id: number; name: string; role: string | null }[];
}

const VALID_SEARCH_KINDS = Object.values(SEARCH_KIND) as string[];

/**
 * 모르는 종류는 `null` — 화면이 못 그리는 값을 그대로 흘리지 않는다
 * (§도메인 상수: BE enum과 이름이 어긋나면 매퍼에서 조용히 틀린다).
 */
function toSearchKind(type: string): SearchKind | null {
  return VALID_SEARCH_KINDS.includes(type) ? (type as SearchKind) : null;
}

/** 종류를 못 알아본 항목은 뺀다 */
export function toRecentViewItems(items: BeSearchOverview["recentItems"]): SearchRecentViewItem[] {
  return items.flatMap((item) => {
    const kind = toSearchKind(item.type);
    if (!kind) return [];
    return [{ kind, id: item.id, title: item.title, meta: item.meta }];
  });
}

export function toProjectBrowseItem(
  project: BeSearchOverview["projects"][number],
): ProjectBrowseItem {
  return {
    id: project.id,
    name: project.name,
    tag: project.tag,
    meetingCount: project.meetingCount,
  };
}

/** 모르는 권한 문자열은 가장 낮은 권한으로 떨어뜨린다(manage-mapper.ts와 같은 규칙, §권한) */
function toAuthority(role: string | null): Authority {
  const values = Object.values(AUTHORITY) as string[];
  return role !== null && values.includes(role) ? (role as Authority) : AUTHORITY.MEMBER;
}

export function toPersonBrowseItem(person: BeSearchOverview["people"][number]): PersonBrowseItem {
  return { id: person.id, name: person.name, authority: toAuthority(person.role) };
}

/**
 * `GET /api/v1/search` 응답 — `results[]`는 종류를 가리지 않는 평평한 모양이다.
 * [확인] `search/presentation/api/response/SearchResponse.java` (2026-08-12 실코드 대조).
 * ⚠️ `project`는 문자열이 아니라 **객체다**(`{id, tag, name, color}`). 전에는 문구로 가정해
 *    실연동 시 프로젝트명 자리에 객체가 흘러 렌더가 깨질 자리였다 — 화면 계약(문구)으로는
 *    태그를 내보낸다(프로젝트 표식은 태그 칩 하나라는 규칙, §도메인 상수).
 */
export interface BeSearchResponse {
  query: string;
  counts: { all: number; meeting: number; action: number; project: number; person: number };
  results: {
    type: string;
    id: number;
    title: string;
    snippet: string | null;
    project: { id: number; tag: string; name: string; color: string | null } | null;
    date: string | null;
    role: string | null;
    score: number;
  }[];
}

/**
 * 모르는 권한 문자열은 **빈 값으로** 둔다 — `toAuthority`(overview의 사람 목록)와 다른 규칙이다.
 * 거긴 "이 사람의 권한은 늘 있다"는 전제라 최저 권한으로 떨어뜨리지만, 검색 결과의 `role`은
 * 요구사항대로 "안 오면 빈 값" — 모르는 문자열도 잘못된 권한 배지를 다는 것보다 안 다는 게 낫다.
 */
function toAuthorityOrNull(role: string | null): Authority | null {
  if (role === null) return null;
  const values = Object.values(AUTHORITY) as string[];
  return values.includes(role) ? (role as Authority) : null;
}

/** BE 정렬 순서를 그대로 지킨다 — 여기서 다시 정렬하지 않는다 */
export function toSearchResults(be: BeSearchResponse): SearchResults {
  const items = be.results.flatMap((hit): SearchResultItem[] => {
    const kind = toSearchKind(hit.type);
    if (!kind) return [];
    return [
      {
        kind,
        id: hit.id,
        title: hit.title,
        snippet: hit.snippet,
        project: hit.project?.tag ?? null,
        date: hit.date,
        role: toAuthorityOrNull(hit.role),
      },
    ];
  });

  return {
    keyword: be.query,
    counts: {
      total: be.counts.all,
      meeting: be.counts.meeting,
      action: be.counts.action,
      project: be.counts.project,
      person: be.counts.person,
    },
    items,
  };
}
