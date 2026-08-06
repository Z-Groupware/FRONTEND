"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PaginatedResult } from "@/lib/paginate";

interface UseInfiniteScrollListOptions<T> {
  initialItems: T[];
  initialPage: number;
  initialTotalPages: number;
  initialTotalCount: number;
  /** 항목의 고유 id — 이어 붙일 때 이 값으로 중복을 거른다(CLAUDE.md §목록·페이지네이션). */
  getId: (item: T) => string;
  /** 다음 페이지를 가져오는 서버 액션. */
  fetchPage: (page: number) => Promise<PaginatedResult<T>>;
}

/**
 * 목록 무한 스크롤 — CLAUDE.md §목록·페이지네이션의 상태 기계만 여기 담는다.
 * 실제 렌더(표·카드·센티널 위치)는 부르는 쪽이 맡는다.
 *
 * ⚠️ 첫 페이지는 서버 컴포넌트가 이미 렌더한 값을 `initialItems`로 받는다 — 여기서 다시
 *    부르지 않는다(§핵심 4원칙 ①).
 * ⚠️ 이어 붙일 때 `getId` 기준으로 중복을 거른다 — 보는 사이에 새 항목이 앞에 들어오면
 *    같은 행이 두 번 보일 수 있다.
 * ⚠️ 실패하면 조용히 멈추지 않는다 — `error`를 보고 부르는 쪽이 "다시 시도"를 띄운다.
 */
export function useInfiniteScrollList<T>({
  initialItems,
  initialPage,
  initialTotalPages,
  initialTotalCount,
  getId,
  fetchPage,
}: UseInfiniteScrollListOptions<T>) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const isFetchingRef = useRef(false);
  const initialItemsRef = useRef(initialItems);

  /**
   * 서버가 첫 페이지를 다시 렌더해 `initialItems`가 새로 오면(정지/정지 해제처럼 상세 패널의
   * 조작이 `revalidatePath`로 이 경로를 다시 그리게 만든 경우) 누적된 로컬 목록 중 그 id와
   * 겹치는 항목만 새 값으로 맞춘다 — 2페이지 이후까지 통째로 버리진 않는다(스크롤 위치 유지).
   */
  useEffect(() => {
    if (initialItems === initialItemsRef.current) return;
    initialItemsRef.current = initialItems;

    setItems((prev) => {
      const freshById = new Map(initialItems.map((item) => [getId(item), item] as const));
      return prev.map((item) => freshById.get(getId(item)) ?? item);
    });
  }, [initialItems, getId]);

  const hasMore = page < totalPages;

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setError(false);

    try {
      const next = page + 1;
      const result = await fetchPage(next);

      setItems((prev) => {
        const seen = new Set(prev.map(getId));
        const appended = result.items.filter((item) => !seen.has(getId(item)));
        return [...prev, ...appended];
      });
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch {
      setError(true);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [page, hasMore, fetchPage, getId]);

  /** 목록 끝의 빈 요소에 붙인다 — 화면에 걸리면 다음 페이지를 부른다(스크롤 이벤트 대신). */
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      });
      observer.observe(node);
      return () => observer.disconnect();
    },
    [loadMore],
  );

  /** 승인·삭제처럼 목록에서 항목이 빠지는 조작 뒤 로컬 상태를 바로 맞춘다(재조회 없이). */
  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => getId(item) !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    },
    [getId],
  );

  return {
    items,
    totalCount,
    hasMore,
    isLoadingMore,
    error,
    loadMore,
    sentinelRef,
    removeItem,
  };
}
