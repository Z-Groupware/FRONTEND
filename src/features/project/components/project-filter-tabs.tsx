import Link from "next/link";

import type { ProjectStatus } from "@/constants/domain";
import { PROJECT_FILTER_TABS } from "@/features/project/lib";
import { cn } from "@/lib/utils";

/**
 * 상태 필터 탭 — `?status=`를 바꾸는 링크라 서버우선(클라 상태 없음).
 * 활성 탭만 먹색으로 채운다(피그마).
 */
export function ProjectFilterTabs({ active }: { active: ProjectStatus }) {
  return (
    <div role="tablist" aria-label="프로젝트 상태 필터" className="flex gap-1">
      {PROJECT_FILTER_TABS.map((tab) => {
        const selected = tab.status === active;
        return (
          <Link
            key={tab.status}
            href={`/app/projects?status=${tab.status}`}
            role="tab"
            aria-selected={selected}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
