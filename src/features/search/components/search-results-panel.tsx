import { SearchX } from "lucide-react";

import type { ProjectBrowseItem, SearchQuery, SearchResults } from "../types";
import { SearchFilterBar } from "./search-filter-bar";
import { SearchResultRow } from "./search-result-row";
import { SearchTabs } from "./search-tabs";

/**
 * 검색어가 있을 때의 화면 — 탭·필터·결과 목록을 한 카드에 담는다(DESIGN §2 카드 anatomy).
 * 순수 표시 + 이동뿐이라 서버에서 그린다. 조건을 바꾸는 잎사귀(입력·셀렉트)만 클라이언트다.
 */
export function SearchResultsPanel({
  results,
  query,
  projects,
  baseParams,
}: {
  results: SearchResults;
  query: SearchQuery;
  projects: ProjectBrowseItem[];
  /** `category`를 뺀 나머지 조건(`q`·`project`·`period`) — 탭이 그대로 이어받는다 */
  baseParams: URLSearchParams;
}) {
  return (
    /*
      ⚠️ **랜딩과 같은 결로 둔다**(2026-08-10). 결과만 카드 하나로 통째로 감싸 두니, 같은
         화면인데 검색 전과 후의 생김새가 달랐다 — 탭·필터는 조작하는 자리라 위에 두고,
         결과는 랜딩처럼 **줄마다 낱장**으로 쌓는다.
    */
    /*
      ⚠️ **검색창과 같은 720 한 칸에 세운다.** 960으로 두니 한 항목이 짧아 오른쪽이 계속
         비었다 — 결과는 `제목 · 어디 · 언제` 한 문장이라 열이 여럿인 표가 아니다.
         입력·탭·결과가 한 세로선에 서면 눈이 위에서 아래로 그대로 내려온다.
      ⚠️ 랜딩은 960 그대로다 — 거기는 두 칸(프로젝트·사람)이 나란히 서야 한다.
    */
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
      <div>
        <SearchTabs counts={results.counts} active={query.category} searchParams={baseParams} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <SearchFilterBar projects={projects} projectTag={query.projectTag} period={query.period} />
        <p className="text-muted-foreground shrink-0 text-[12px] leading-4 tabular-nums">
          결과 {results.items.length}건
        </p>
      </div>

      {results.items.length === 0 ? (
        <div className="border-border bg-card flex flex-col items-center gap-2 rounded-2xl border px-6 py-16 text-center">
          <SearchX className="text-muted-foreground/50 size-6" aria-hidden />
          <p className="text-foreground text-[13px] leading-5 font-medium">검색 결과가 없습니다</p>
          <p className="text-muted-foreground text-[12px] leading-4">
            다른 검색어로 찾거나 필터를 전체로 바꿔 주세요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.items.map((item) => (
            <SearchResultRow
              key={`${item.kind}-${item.id}`}
              item={item}
              keyword={results.keyword}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
