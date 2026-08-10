/** 페이지 하나로 잘라낸 결과. */
export interface PaginatedResult<T> {
  items: T[];
  /** 범위를 벗어난 요청은 안으로 당겨진 값이다 — 호출한 쪽 페이지 번호와 다를 수 있다 */
  page: number;
  totalPages: number;
  totalCount: number;
}

/**
 * 배열을 페이지 단위로 자른다.
 * ⚠️ **`page`는 0-base다**(BE 표준 확정, 2026-08-10 — `page=0`이 첫 페이지). 실 API의
 *    `PageResponse`와 인덱스가 그대로 맞아야 연동 시 변환 코드가 안 생긴다.
 * ⚠️ `page`가 범위를 벗어나면(음수·마지막 페이지 초과) **안으로 당긴다** — 빈 화면 대신
 *    가장 가까운 유효 페이지를 보여준다.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * pageSize;

  return { items: items.slice(start, start + pageSize), page: safePage, totalPages, totalCount };
}

const ELLIPSIS = "ellipsis";

/**
 * 페이지 번호 목록을 **생략 있는 축약형**으로 계산한다 — 항상 첫·끝 페이지를 보여주고,
 * 현재 페이지 좌우 1칸만 펼친 뒤 나머지는 "…"로 접는다.
 * ⚠️ 기업 수가 무한히 늘어날 수 있어 페이지가 수백 개가 될 수 있다 — 전부 나열하면 못 쓴다.
 */
export function getPaginationRange(page: number, totalPages: number): (number | typeof ELLIPSIS)[] {
  const SIBLING_COUNT = 1;
  const totalVisible = SIBLING_COUNT * 2 + 5; // 첫·끝·현재·양옆 + 생략 자리 둘

  if (totalPages <= totalVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(page - SIBLING_COUNT, 1);
  const rightSibling = Math.min(page + SIBLING_COUNT, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + SIBLING_COUNT * 2 }, (_, index) => index + 1);
    return [...leftRange, ELLIPSIS, totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + SIBLING_COUNT * 2;
    const rightRange = Array.from(
      { length: rightCount },
      (_, index) => totalPages - rightCount + 1 + index,
    );
    return [1, ELLIPSIS, ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, index) => leftSibling + index,
  );
  return [1, ELLIPSIS, ...middleRange, ELLIPSIS, totalPages];
}
