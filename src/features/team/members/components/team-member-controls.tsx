import Link from "next/link";

import { cn } from "@/lib/utils";

import {
  DEFAULT_TEAM_MEMBER_FILTER,
  DEFAULT_TEAM_MEMBER_SORT,
  TEAM_MEMBER_FILTER_TABS,
  TEAM_MEMBER_SORT_TABS,
  type TeamMemberFilter,
  type TeamMemberSort,
} from "../lib";

interface TeamMemberControlsProps {
  activeSort: TeamMemberSort;
  activeFilter: TeamMemberFilter;
}

function buildHref(sort: TeamMemberSort, filter: TeamMemberFilter): string {
  const params = new URLSearchParams();
  if (sort !== DEFAULT_TEAM_MEMBER_SORT) params.set("sort", sort);
  if (filter !== DEFAULT_TEAM_MEMBER_FILTER) params.set("filter", filter);
  const query = params.toString();
  return query ? `/team/members?${query}` : "/team/members";
}

/**
 * 정렬·필터 컨트롤 — **서버우선 `<Link>`**다(project 목록·팀원 목록과 같은 결).
 * 한쪽을 바꿀 때 다른 쪽 값은 그대로 유지해야 해서 둘 다 항상 같이 넘긴다.
 */
export function TeamMemberControls({ activeSort, activeFilter }: TeamMemberControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground text-[12px] leading-4">정렬</span>
        <div role="group" aria-label="정렬" className="flex flex-wrap items-center gap-1">
          {TEAM_MEMBER_SORT_TABS.map((tab) => (
            <Link
              key={tab.sort}
              href={buildHref(tab.sort, activeFilter)}
              aria-current={activeSort === tab.sort ? "page" : undefined}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[13px] leading-5 transition-colors",
                activeSort === tab.sort
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground text-[12px] leading-4">필터</span>
        <div role="group" aria-label="필터" className="flex flex-wrap items-center gap-1">
          {TEAM_MEMBER_FILTER_TABS.map((tab) => (
            <Link
              key={tab.filter}
              href={buildHref(activeSort, tab.filter)}
              aria-current={activeFilter === tab.filter ? "page" : undefined}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[13px] leading-5 transition-colors",
                activeFilter === tab.filter
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
