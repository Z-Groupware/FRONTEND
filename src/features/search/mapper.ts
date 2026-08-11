import { AUTHORITY, type Authority } from "@/constants/domain";

import type { PersonBrowseItem, ProjectBrowseItem, SearchRecentViewItem } from "./types";
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
