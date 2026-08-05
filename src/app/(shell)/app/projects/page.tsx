import type { Metadata } from "next";

import { ProjectFilterTabs } from "@/features/project/components/project-filter-tabs";
import { ProjectListItem } from "@/features/project/components/project-list-item";
import { parseProjectStatus } from "@/features/project/lib";
import { getProjectList } from "@/features/project/server";

export const metadata: Metadata = {
  title: "프로젝트",
};

interface ProjectsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { status } = await searchParams;
  const active = parseProjectStatus(status);
  const projects = await getProjectList(active);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4">
        <ProjectFilterTabs active={active} />

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
