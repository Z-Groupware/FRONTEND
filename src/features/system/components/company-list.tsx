"use client";

import { Button } from "@/components/ui/button";
import { useInfiniteScrollList } from "@/hooks/use-infinite-scroll-list";

import { fetchCompaniesPageAction } from "../actions";
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
  buildDetailHref: (id: string) => string;
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
  buildDetailHref,
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

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">전체 {totalCount}건</p>

      <CompanyTable companies={items} buildDetailHref={buildDetailHref} pageSize={pageSize} />

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-1">
          {error ? (
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs">불러오지 못했습니다</p>
              <Button type="button" variant="outline" size="xs" onClick={loadMore}>
                다시 시도
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isLoadingMore}
              onClick={loadMore}
            >
              {isLoadingMore ? "불러오는 중…" : "더 보기"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
