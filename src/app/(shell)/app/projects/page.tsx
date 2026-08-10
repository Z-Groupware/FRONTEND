import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ProjectFilterTabs } from "@/features/project/components/project-filter-tabs";
import { ProjectListTable } from "@/features/project/components/project-list-table";
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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** 같은 키가 여러 번 오면(`?q=a&q=b`) 첫 값만 쓴다 — 파서·trim이 배열을 못 받는다. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const keyword = first(params.q);
  const activeStatus = parseProjectStatus(first(params.status));
  const activeSort = parseProjectSort(first(params.sort));

  const [projects, counts, viewer] = await Promise.all([
    getProjectList({ status: activeStatus, keyword, sort: activeSort }),
    getProjectStatusCounts(keyword),
    getViewer(),
  ]);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        {/*
          ⚠️ **툴바를 카드 안으로 들였다**(2026-08-10). 검색·정렬·상태 탭·건수·생성 버튼이
             카드 밖에 두 줄로 흩어져 있어서, 목록이 어디서 시작하는지가 화면에 안 그려졌다 —
             `사원 관리`·`저장소 관리`는 이미 한 카드 안에 툴바 한 줄 + 표로 서 있다.
             같은 성격의 화면이 다르게 생기면 옮겨 다닐 때마다 새 화면처럼 읽힌다.
          ⚠️ 상단바에는 버튼을 두지 않는다(팀 규칙) — 생성 버튼은 본문 안, Owner 전용이다.
        */}
        <section className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="flex flex-wrap items-center gap-3 px-7 pt-6 pb-5">
            <ProjectToolbar />
            <ProjectFilterTabs
              active={activeStatus}
              counts={counts}
              keyword={keyword}
              sort={activeSort}
            />

            {/* 남는 자리는 비워 둔다 — 건수와 버튼이 오른쪽 끝에 선다 */}
            <span className="flex-1" aria-hidden />

            <span className="text-foreground/75 shrink-0 text-[12px] leading-4 tabular-nums">
              전체 {projects.length}개
            </span>
            {canCreateProject(viewer) && (
              /*
                ⚠️ 크기는 **사원 관리의 [계정 발급]과 같다**(`size="sm"` — 높이 28, 글자 12.8px).
                   기본 크기(32·14px)면 같은 줄의 거르개 알약(28)보다 커서 이 버튼만 한 단
                   위로 뜬다. 같은 성격의 화면에서 같은 자리의 버튼은 같은 크기여야 한다.
              */
              <Link
                href="/app/projects/new"
                className={cn(buttonVariants({ variant: "ink", size: "sm" }), "shrink-0")}
              >
                <Plus />새 프로젝트
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            /* 빈 상태 — 무엇이 없는지 적는다(§3상태) */
            <p className="text-muted-foreground border-border border-t px-6 py-12 text-center text-[13px] leading-5 break-keep">
              {keyword?.trim() ? "검색 결과가 없습니다." : "해당 상태의 프로젝트가 없습니다."}
            </p>
          ) : (
            <ProjectListTable projects={projects} />
          )}
        </section>
      </div>
    </main>
  );
}
