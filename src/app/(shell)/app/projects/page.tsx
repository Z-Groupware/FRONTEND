import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ProjectFilterTabs } from "@/features/project/components/project-filter-tabs";
import { ProjectListItem } from "@/features/project/components/project-list-item";
import { parseProjectStatus } from "@/features/project/lib";
import { getProjectList } from "@/features/project/server";
import { getViewer } from "@/features/shell/viewer";
import { canCreateProject } from "@/lib/permission";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "프로젝트",
};

interface ProjectsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { status } = await searchParams;
  const active = parseProjectStatus(status);
  const [projects, viewer] = await Promise.all([getProjectList(active), getViewer()]);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4">
        {/* 상단바엔 버튼을 두지 않는다(팀 규칙) — 생성 버튼은 본문 안, Owner 전용 */}
        <div className="flex items-center justify-between gap-4">
          <ProjectFilterTabs active={active} />
          {canCreateProject(viewer) && (
            <Link
              href="/app/projects/new"
              className={cn(buttonVariants({ variant: "ink" }), "shrink-0")}
            >
              <Plus />새 프로젝트
            </Link>
          )}
        </div>

        <section className="border-border bg-card overflow-hidden rounded-xl border">
          {projects.length === 0 ? (
            <p className="text-muted-foreground flex items-center justify-center px-4 py-16 text-sm">
              해당 상태의 프로젝트가 없습니다.
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
