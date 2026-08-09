import type { RecentSearchEntry } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전. **서버 프로세스 메모리에만 있다**(재시작하면 초기값으로 되돌아간다).
 * `recordSearchAction`이 이 배열을 직접 바꾼다 — 실제 DB 흉내다.
 * ⚠️ 로그인(세션)이 없어 "이 사용자의 최근 검색"이 아니라 **전역**으로 흉내 낸다(§정직성).
 * ⚠️ `globalThis`에 매단다 — dev의 HMR로 `let`이 초기화되면 방금 한 검색이 사라진다.
 */
const INITIAL: RecentSearchEntry[] = [
  { keyword: "로드맵", searchedAt: "2026-08-06T09:00:00+09:00" },
  { keyword: "API 명세", searchedAt: "2026-08-07T11:30:00+09:00" },
  { keyword: "브랜드 캠페인", searchedAt: "2026-08-07T15:10:00+09:00" },
];

/** 한 번에 들고 있는 최근 검색어 수 — 넘치면 오래된 것부터 밀어낸다 */
const MAX_ENTRIES = 5;

const globalStore = globalThis as typeof globalThis & { __recentSearchStore?: RecentSearchEntry[] };
const store = (globalStore.__recentSearchStore ??= INITIAL);

/** 최근 것이 앞에 오도록 정렬해 돌려준다 */
export function listMockRecentSearches(): RecentSearchEntry[] {
  return [...store].sort((a, b) => b.searchedAt.localeCompare(a.searchedAt)).slice(0, MAX_ENTRIES);
}

/**
 * 검색 기록 — 같은 검색어가 이미 있으면 시각만 갱신해 맨 앞으로 올린다.
 * ⚠️ `searchedAt`은 서버에서 계산해 넘긴다(클라이언트 시계를 믿지 않는다).
 */
export function addMockRecentSearch(keyword: string, searchedAt: string): void {
  const trimmed = keyword.trim();
  if (!trimmed) return;

  const withoutDuplicate = store.filter((entry) => entry.keyword !== trimmed);
  const next = [{ keyword: trimmed, searchedAt }, ...withoutDuplicate].slice(0, MAX_ENTRIES);

  store.length = 0;
  store.push(...next);
}
