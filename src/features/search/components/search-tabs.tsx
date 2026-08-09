import Link from "next/link";

import { cn } from "@/lib/utils";

import type { SearchCategory, SearchCategoryCounts } from "../types";
import { SEARCH_CATEGORY, SEARCH_CATEGORY_LABEL } from "../types";

const TAB_ORDER: SearchCategory[] = [
  SEARCH_CATEGORY.ALL,
  SEARCH_CATEGORY.MEETING,
  SEARCH_CATEGORY.ACTION,
  SEARCH_CATEGORY.PROJECT,
  SEARCH_CATEGORY.PERSON,
];

function countFor(counts: SearchCategoryCounts, category: SearchCategory): number {
  if (category === SEARCH_CATEGORY.ALL) return counts.total;
  return counts[category];
}

/**
 * 결과 카테고리 탭 — **순수 이동**이라 서버에서 그린다(클라이언트로 뺄 이유가 없다).
 * 지금 켠 조건(`?q=&project=&period=`)은 그대로 두고 `category`만 바꾼다.
 */
export function SearchTabs({
  counts,
  active,
  searchParams,
}: {
  counts: SearchCategoryCounts;
  active: SearchCategory;
  searchParams: URLSearchParams;
}) {
  return (
    <div role="tablist" className="border-border flex gap-1 border-b">
      {TAB_ORDER.map((category) => {
        const params = new URLSearchParams(searchParams);
        if (category === SEARCH_CATEGORY.ALL) params.delete("category");
        else params.set("category", category);

        const isActive = category === active;

        return (
          <Link
            key={category}
            href={`/app/search?${params}`}
            role="tab"
            aria-selected={isActive}
            replace
            scroll={false}
            className={cn(
              "focus-visible:ring-ring -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-hidden",
              isActive
                ? "border-foreground text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {SEARCH_CATEGORY_LABEL[category]}
            <span className="tabular-nums">{countFor(counts, category)}</span>
          </Link>
        );
      })}
    </div>
  );
}
