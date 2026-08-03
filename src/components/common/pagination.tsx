import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { getPaginationRange } from "@/lib/paginate";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** 페이지 번호 → 그 페이지의 href. 목록 화면마다 유지해야 할 다른 쿼리(검색어 등)가 다르다 */
  buildHref: (page: number) => string;
}

const ITEM_CLASS =
  "focus-visible:ring-ring flex size-8 items-center justify-center rounded-md text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none";

/**
 * 목록 하단 페이지네이션 — 순수 서버 컴포넌트다(`Link` 이동만 하므로 클라이언트 JS가 없다).
 * ⚠️ 기업·회의·액션처럼 무한히 늘어날 수 있는 목록은 이 컴포넌트를 쓴다(CLAUDE.md §성능).
 */
export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = getPaginationRange(page, totalPages);

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1">
      <PageLink
        href={buildHref(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </PageLink>

      {range.map((entry, index) =>
        entry === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden
            className="text-muted-foreground flex size-8 items-center justify-center text-sm"
          >
            …
          </span>
        ) : (
          <PageLink
            key={entry}
            href={buildHref(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={
              entry === page
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            }
          >
            <span className="tabular-nums">{entry}</span>
          </PageLink>
        ),
      )}

      <PageLink
        href={buildHref(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="size-4" aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { disabled?: boolean }) {
  if (disabled) {
    return (
      <span className={cn(ITEM_CLASS, "text-muted-foreground/40", className)} aria-disabled>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={cn(ITEM_CLASS, className)} {...props}>
      {children}
    </Link>
  );
}
