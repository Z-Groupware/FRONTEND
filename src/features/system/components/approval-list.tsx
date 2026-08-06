"use client";

import { InfiniteListFooter } from "@/components/common/infinite-list-footer";
import { useInfiniteScrollList } from "@/hooks/use-infinite-scroll-list";

import { fetchApprovalsPageAction } from "../actions";
import type { PendingCompanyApproval } from "../types";
import { ApprovalTable } from "./approval-table";

interface ApprovalListProps {
  initialItems: PendingCompanyApproval[];
  initialPage: number;
  initialTotalPages: number;
  initialTotalCount: number;
  pageSize: number;
}

/**
 * "기업 승인" 무한 스크롤 목록 — 첫 페이지는 서버가 렌더하고, 그 아래부터는 스크롤이 끝에
 * 닿으면(또는 [더 보기] 클릭) 다음 페이지를 이어붙인다(CLAUDE.md §목록·페이지네이션).
 * ⚠️ [더 보기] 버튼이 곧 감시 대상이다 — 화면에 걸리면 자동으로 다음 페이지를 부르고,
 *    키보드·스크린리더 사용자는 버튼을 눌러 같은 일을 할 수 있다(§a11y).
 */
export function ApprovalList({
  initialItems,
  initialPage,
  initialTotalPages,
  initialTotalCount,
  pageSize,
}: ApprovalListProps) {
  const { items, totalCount, hasMore, isLoadingMore, error, loadMore, sentinelRef, removeItem } =
    useInfiniteScrollList({
      initialItems,
      initialPage,
      initialTotalPages,
      initialTotalCount,
      getId: (item) => item.id,
      fetchPage: (page) => fetchApprovalsPageAction(page, pageSize),
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">전체 {totalCount}건</p>

      <ApprovalTable companies={items} onRowDone={removeItem} pageSize={pageSize} />

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
