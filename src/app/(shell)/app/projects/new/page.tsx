import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createProjectAction } from "@/features/project/actions";
import { ProjectForm } from "@/features/project/components/project-form";
import { getCompanyTeamOptions } from "@/features/project/server";
import { getViewer } from "@/features/shell/viewer";
import { canCreateProject } from "@/lib/permission";

export const metadata: Metadata = {
  title: "새 프로젝트",
};

export default async function AppProjectNewPage() {
  const viewer = await getViewer();
  // 권한 없는 사람은 화면 자체를 숨긴다(404) — 서버 재검사는 액션에서도 한 번 더(§권한).
  if (!canCreateProject(viewer)) notFound();

  const teamOptions = await getCompanyTeamOptions();

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs">
            <Link href="/app/projects" className="hover:text-foreground">
              프로젝트
            </Link>{" "}
            &gt; 새 프로젝트
          </p>
          <h2 className="text-foreground text-base font-semibold">새 프로젝트</h2>
        </div>

        <div className="border-border bg-card rounded-xl border p-6">
          <ProjectForm
            action={createProjectAction}
            teamOptions={teamOptions}
            cancelHref="/app/projects"
          />
        </div>
      </div>
    </main>
  );
}
