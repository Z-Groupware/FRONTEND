import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SearchInput } from "@/features/search/components/search-input";
import { SearchLanding } from "@/features/search/components/search-landing";
import { SearchResultsPanel } from "@/features/search/components/search-results-panel";
import { parseSearchQuery } from "@/features/search/lib";
import { getSearchHome, getSearchProjects, getSearchResults } from "@/features/search/server";

export const metadata: Metadata = {
  title: "검색",
};

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 검색 — 키워드가 없으면 랜딩(최근 검색어·최근 본 항목·둘러보기), 있으면 결과 목록이다.
 * 조회뿐이라 Server Component 하나로 끝난다. 검색창·필터만 잎사귀로 나가 있다(CLAUDE.md §핵심 4원칙 1).
 *
 * ⚠️ **`getSearchHome()`은 랜딩일 때만 부른다.** 결과 화면이 필요한 건 필터용 프로젝트
 *    목록뿐인데 `getSearchHome()`은 최근 검색어·최근 본 항목까지 같이 불러온다 —
 *    그걸 늘 같이 부르면 랜딩 쪽 조회가 실패했을 때 검색 결과 화면까지 같이 죽는다.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = parseSearchQuery(await searchParams);
  const keyword = query.keyword.trim();

  // 탭이 이어받을 조건 — `category`만 빼고 그대로 넘긴다
  const baseParams = new URLSearchParams();
  if (query.keyword) baseParams.set("q", query.keyword);
  if (query.projectTag) baseParams.set("project", query.projectTag);
  if (query.period !== "all") baseParams.set("period", query.period);

  let content: ReactNode;
  if (keyword) {
    const [results, projects] = await Promise.all([getSearchResults(query), getSearchProjects()]);
    content = (
      <SearchResultsPanel
        results={results}
        query={query}
        projects={projects}
        baseParams={baseParams}
      />
    );
  } else {
    const home = await getSearchHome();
    content = <SearchLanding home={home} />;
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      {/*
        ⚠️ **목록 화면과 같은 폭(1440)을 왼쪽 끝에서부터 쓴다**(§DESIGN 4). 전에는 그 안에서
           내용만 720으로 **가운데 띄웠는데**, 제목·아이콘은 왼쪽 끝에 있고 내용만 한가운데라
           **축이 둘**이 됐다 — 화면이 안 맞는 것처럼 읽혔다(액션 상세에서 겪은 것과 같다).
        ⚠️ **입력만 좁게 둔다.** 한 줄 입력이 1440까지 늘어나면 글자가 왼쪽 끝에만 붙고
           오른쪽이 통째로 빈다 — 결과 목록은 넓을수록 좋지만 입력은 아니다.
      */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        <div className="w-full max-w-[720px]">
          <SearchInput keyword={query.keyword} />
        </div>
        {content}
      </div>
    </main>
  );
}
