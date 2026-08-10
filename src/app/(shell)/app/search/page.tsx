import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SearchInput } from "@/features/search/components/search-input";
import { SearchLanding } from "@/features/search/components/search-landing";
import { SearchResultsPanel } from "@/features/search/components/search-results-panel";
import { parseSearchQuery } from "@/features/search/lib";
import { getSearchHome, getSearchProjects, getSearchResults } from "@/features/search/server";
import type { RecentSearchEntry } from "@/features/search/types";

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
  /* 최근 검색어는 입력 바로 아래에 서므로 페이지가 들고 있는다 — 검색 중일 때는 안 띄운다 */
  let recentSearches: RecentSearchEntry[] = [];
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
    recentSearches = home.recentSearches;
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
      {/*
        ⚠️ **1440을 다 쓰지 않는다.** 검색 결과 줄은 짧은 값 몇 개뿐이라 폭이 넓을수록 가운데가
           휑해진다 — 표처럼 열이 여럿인 화면이 아니다. 다만 1040은 너무 좁아 목록이 답답했다.
           1240은 카드가 시원하면서도 한 줄이 한 문장으로 읽히는 거리다.
        ⚠️ 가운데 세운다 — 위 검색창이 가운데라 본문만 왼쪽에 붙으면 축이 둘이 된다.
      */}
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-7">
        {/*
          ⚠️ **입력은 가운데 세운다.** 왼쪽에 붙여 두니 넓은 화면에서 한쪽으로 몰려 보였다 —
             찾으러 온 사람이 제일 먼저 보는 것이라 화면 한복판에 서는 게 맞다.
          ⚠️ 폭은 720 그대로다. 1440까지 늘리면 글자가 왼쪽 끝에만 붙고 오른쪽이 통째로 빈다.
        */}
        {/*
          ⚠️ **입력과 최근 검색어를 한 덩이로 가운데 세운다.** 둘은 같은 일(찾기 시작하기)을
             하는데 따로 떨어져 있으면 최근 검색어가 "목록 중 하나"로 보인다.
          ⚠️ 위아래 여백을 넉넉히 준다 — 이 자리가 화면의 주인공이라 붐비면 안 된다.
        */}
        <div className="mx-auto w-full max-w-[720px] pt-4 pb-2">
          <SearchInput keyword={query.keyword} recentSearches={recentSearches} />
        </div>
        {content}
      </div>
    </main>
  );
}
