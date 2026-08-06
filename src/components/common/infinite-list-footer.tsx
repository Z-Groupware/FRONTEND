"use client";

import { Button } from "@/components/ui/button";

interface InfiniteListFooterProps {
  hasMore: boolean;
  isLoadingMore: boolean;
  error: boolean;
  onLoadMore: () => void;
  /** 목록 끝의 감시 대상 — `useInfiniteScrollList`의 `sentinelRef`를 그대로 넘긴다 */
  sentinelRef: (node: HTMLElement | null) => void;
}

/**
 * 무한 스크롤 목록의 하단 상태 — [더 보기]/[다시 시도] 버튼이 곧 `IntersectionObserver` 감시
 * 대상이다(CLAUDE.md §목록·페이지네이션). `approval-list.tsx`·`company-list.tsx`가 같이 쓴다.
 * ⚠️ `role="status" aria-live="polite"` — 로딩·실패 문구가 스크린 리더에도 그때그때 들린다.
 */
export function InfiniteListFooter({
  hasMore,
  isLoadingMore,
  error,
  onLoadMore,
  sentinelRef,
}: InfiniteListFooterProps) {
  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} role="status" aria-live="polite" className="flex justify-center py-1">
      {error ? (
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs">불러오지 못했습니다</p>
          <Button type="button" variant="outline" size="xs" onClick={onLoadMore}>
            다시 시도
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={isLoadingMore}
          onClick={onLoadMore}
        >
          {isLoadingMore ? "불러오는 중…" : "더 보기"}
        </Button>
      )}
    </div>
  );
}
