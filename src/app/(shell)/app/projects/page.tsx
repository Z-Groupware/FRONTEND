import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ProjectFilterTabs } from "@/features/project/components/project-filter-tabs";
import { ProjectListItem } from "@/features/project/components/project-list-item";
import { ProjectToolbar } from "@/features/project/components/project-toolbar";
import { parseProjectSort, parseProjectStatus } from "@/features/project/lib";
import { getProjectList, getProjectStatusCounts } from "@/features/project/server";
import { getViewer } from "@/features/shell/viewer";
import { canCreateProject } from "@/lib/permission";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "프로젝트",
};

interface ProjectsPageProps {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { status, q, sort } = await searchParams;
  const activeStatus = parseProjectStatus(status);
  const activeSort = parseProjectSort(sort);

  const [projects, counts, viewer] = await Promise.all([
    getProjectList({ status: activeStatus, keyword: q, sort: activeSort }),
    getProjectStatusCounts(q),
    getViewer(),
  ]);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4">
        {/* 상단바엔 버튼을 두지 않는다(팀 규칙) — 생성 버튼은 본문 안, Owner 전용 */}
        <div className="flex items-center justify-between gap-4">
          <ProjectFilterTabs active={activeStatus} counts={counts} keyword={q} sort={activeSort} />
          {canCreateProject(viewer) && (
            <Link
              href="/app/projects/new"
              className={cn(buttonVariants({ variant: "ink" }), "shrink-0")}
            >
              <Plus />새 프로젝트
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <ProjectToolbar />
          <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
            전체 {projects.length}개
          </span>
        </div>

        {/* 최소 높이를 둬서 목록이 짧거나 비어도 화면에 안정적으로 자리잡게 한다(탭 전환 시 높이 안 튐) */}
        <section className="border-border bg-card flex min-h-[360px] flex-col overflow-hidden rounded-xl border">
          {projects.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center px-4 text-sm">
              {q?.trim() ? "검색 결과가 없습니다." : "해당 상태의 프로젝트가 없습니다."}
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {projects.map((project) => (
                <ProjectListItem key={project.id} project={project} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
