"use client";

import { useCallback } from "react";

import { InfiniteListFooter } from "@/components/common/infinite-list-footer";
import { useInfiniteScrollList } from "@/hooks/use-infinite-scroll-list";

import { fetchCompaniesPageAction } from "../actions";
import { buildCompanyHref, type CompanyHrefQuery } from "../lib/company-href";
import type { CompanyListFilter } from "../server";
import type { ManagedCompany } from "../types";
import { CompanyTable } from "./company-table";

interface CompanyListProps {
  initialItems: ManagedCompany[];
  initialPage: number;
  initialTotalPages: number;
  initialTotalCount: number;
  pageSize: number;
  filter: CompanyListFilter;
  /**
   * 상세 링크를 만드는 데 필요한 값만(직렬화 가능한 값) 받는다 — 서버 컴포넌트에서 만든
   * 클로저(`(id) => ...`)를 그대로 내려보낼 수 없다(함수는 서버→클라이언트 경계를 못 건넌다).
   * 링크 자체는 `buildCompanyHref`(순수 함수, 양쪽에서 같이 import)로 여기서 계산한다.
   */
  query: CompanyHrefQuery;
}

/**
 * "기업 관리" 무한 스크롤 목록 — `approval-list.tsx`와 같은 패턴(CLAUDE.md §목록·페이지네이션).
 * ⚠️ 검색·정렬이 바뀌면 이 컴포넌트는 **다시 마운트돼야 한다** — 부르는 쪽(`page.tsx`)이
 *    필터 값으로 만든 `key`를 붙여, 필터가 바뀔 때 이어붙인 예전 결과가 안 섞이게 한다.
 */
export function CompanyList({
  initialItems,
  initialPage,
  initialTotalPages,
  initialTotalCount,
  pageSize,
  filter,
  query,
}: CompanyListProps) {
  const { items, totalCount, hasMore, isLoadingMore, error, loadMore, sentinelRef } =
    useInfiniteScrollList({
      initialItems,
      initialPage,
      initialTotalPages,
      initialTotalCount,
      getId: (item) => item.id,
      fetchPage: (page) => fetchCompaniesPageAction(filter, page, pageSize),
    });

  const buildDetailHref = useCallback((id: string) => buildCompanyHref(query, id), [query]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">전체 {totalCount}건</p>

      <CompanyTable companies={items} buildDetailHref={buildDetailHref} pageSize={pageSize} />

      <InfiniteListFooter
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        error={error}
        onLoadMore={loadMore}
        sentinelRef={sentinelRef}
      />
    </div>
  );
}
