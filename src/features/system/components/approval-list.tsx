"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { InfiniteListFooter } from "@/components/common/infinite-list-footer";
import { APPROVAL_RESULT_LABEL, isApprovalResult } from "@/constants/system";
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

/** 컴포넌트 밖에 둬서 매 렌더 새 함수가 안 되게 한다(`loadMore`의 의존값이라, 새 함수면
 * 센티널이 매번 재부착돼 옵저버가 다시 붙는다 — 실패 뒤 재시도가 꼬일 수 있다). */
function getId(item: PendingCompanyApproval) {
  return item.id;
}

/**
 * "기업 승인" 무한 스크롤 목록 — 첫 페이지는 서버가 렌더하고, 그 아래부터는 스크롤이 끝에
 * 닿으면(또는 [더 보기] 클릭) 다음 페이지를 이어붙인다(CLAUDE.md §목록·페이지네이션).
 * ⚠️ [더 보기] 버튼이 곧 감시 대상이다 — 화면에 걸리면 자동으로 다음 페이지를 부르고,
 *    키보드·스크린리더 사용자는 버튼을 눌러 같은 일을 할 수 있다(§a11y).
 * ⚠️ 승인·반려는 이제 상세 페이지(`[companyId]/page.tsx`)에서 끝나고 `?done=approve|reject`를
 *    달고 이 목록으로 돌아온다 — 여기서 그 쿼리를 보고 토스트를 띄운 뒤 곧바로 지운다
 *    (새로고침·뒤로가기에서 같은 토스트가 다시 뜨지 않게).
 */
export function ApprovalList({
  initialItems,
  initialPage,
  initialTotalPages,
  initialTotalCount,
  pageSize,
}: ApprovalListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const done = searchParams.get("done");

  useEffect(() => {
    if (!done) return;
    if (isApprovalResult(done)) toast.success(APPROVAL_RESULT_LABEL[done]);
    router.replace("/system/approval");
  }, [done, router]);

  const fetchPage = useCallback(
    (page: number) => fetchApprovalsPageAction(page, pageSize),
    [pageSize],
  );

  const { items, totalCount, hasMore, isLoadingMore, error, loadMore, sentinelRef } =
    useInfiniteScrollList({
      initialItems,
      initialPage,
      initialTotalPages,
      initialTotalCount,
      getId,
      fetchPage,
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">전체 {totalCount}건</p>

      <ApprovalTable companies={items} pageSize={pageSize} />

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
