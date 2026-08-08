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
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="px-6 pt-5">
        <SearchTabs counts={results.counts} active={query.category} searchParams={baseParams} />
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-3">
        <SearchFilterBar projects={projects} projectTag={query.projectTag} period={query.period} />
        <p className="text-muted-foreground shrink-0 text-xs tabular-nums">
          결과 {results.items.length}건
        </p>
      </div>

      {results.items.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-2 border-t px-6 py-16 text-center">
          <SearchX className="text-muted-foreground/50 size-6" aria-hidden />
          <p className="text-foreground text-sm font-medium">검색 결과가 없어요</p>
          <p className="text-muted-foreground text-xs">
            다른 검색어로 찾거나 필터를 전체로 바꿔보세요.
          </p>
        </div>
      ) : (
        <ul className="border-border border-t">
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
