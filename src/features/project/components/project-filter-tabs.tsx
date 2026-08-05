import Link from "next/link";

import { DEFAULT_PROJECT_SORT, type ProjectSort, type ProjectStatus } from "@/constants/domain";
import { PROJECT_FILTER_TABS } from "@/features/project/lib";
import { cn } from "@/lib/utils";

interface ProjectFilterTabsProps {
  active: ProjectStatus;
  /** 상태별 개수(검색 결과 기준) — 탭 뒤 배지 */
  counts: Record<ProjectStatus, number>;
  /** 탭을 바꿔도 검색·정렬은 유지한다 */
  keyword?: string;
  sort?: ProjectSort;
}

/**
 * 상태 필터 탭 — `?status=`를 바꾸는 링크라 서버우선(클라 상태 없음).
 * 활성 탭만 먹색으로 채우고, 뒤에 개수 배지를 단다. 검색어·정렬은 링크에 실어 보존한다.
 */
export function ProjectFilterTabs({ active, counts, keyword, sort }: ProjectFilterTabsProps) {
  const hrefFor = (status: ProjectStatus) => {
    const params = new URLSearchParams({ status });
    if (keyword?.trim()) params.set("q", keyword.trim());
    if (sort && sort !== DEFAULT_PROJECT_SORT) params.set("sort", sort);
    return `/app/projects?${params.toString()}`;
  };

  return (
    <nav aria-label="프로젝트 상태 필터" className="flex gap-1">
      {PROJECT_FILTER_TABS.map((tab) => {
        const selected = tab.status === active;
        return (
          <Link
            key={tab.status}
            href={hrefFor(tab.status)}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "tabular-nums",
                selected ? "text-background/70" : "text-muted-foreground/70",
              )}
            >
              {counts[tab.status]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
