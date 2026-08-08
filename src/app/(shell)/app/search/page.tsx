import type { Metadata } from "next";

import { SearchInput } from "@/features/search/components/search-input";
import { SearchLanding } from "@/features/search/components/search-landing";
import { SearchResultsPanel } from "@/features/search/components/search-results-panel";
import { parseSearchQuery } from "@/features/search/lib";
import { getSearchHome, getSearchResults } from "@/features/search/server";

export const metadata: Metadata = {
  title: "검색",
};

/**
 * 검색 — 키워드가 없으면 랜딩(최근 검색어·최근 본 항목·둘러보기), 있으면 결과 목록이다.
 * 조회뿐이라 Server Component 하나로 끝난다. 검색창·필터만 잎사귀로 나가 있다(CLAUDE.md §핵심 4원칙 1).
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseSearchQuery(await searchParams);
  const home = await getSearchHome();
  const results = query.keyword.trim() ? await getSearchResults(query) : null;

  // 탭이 이어받을 조건 — `category`만 빼고 그대로 넘긴다
  const baseParams = new URLSearchParams();
  if (query.keyword) baseParams.set("q", query.keyword);
  if (query.projectTag) baseParams.set("project", query.projectTag);
  if (query.period !== "all") baseParams.set("period", query.period);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      {/*
        ⚠️ 바깥은 다른 목록 화면과 같은 1440(§DESIGN 4 폭)이지만, 검색은 한 줄 입력에서
           시작하는 화면이라 안쪽 내용은 공지 상세처럼 720으로 좁힌다(§DESIGN 1 "읽는 글은 좁게").
      */}
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-7">
          <SearchInput keyword={query.keyword} />

          {results ? (
            <SearchResultsPanel
              results={results}
              query={query}
              projects={home.projects}
              baseParams={baseParams}
            />
          ) : (
            <SearchLanding home={home} />
          )}
        </div>
      </div>
    </main>
  );
}
