import { Paperclip } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isDelayed } from "@/constants/domain";
import type { TimelineActionInput } from "@/features/member/action-timeline";
import { ActionTimeline, ActionTimelineLegend } from "@/features/member/components/action-timeline";
import {
  parseProjectDetailTab,
  PROJECT_DETAIL_TABS,
  PROJECT_TIMELINE_BOX_HEIGHT,
} from "@/features/project/lib";
import { getProjectDetail, getProjectTeamActions } from "@/features/project/server";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

interface ProjectDetailPageProps {
  params: Promise<{ projectTag: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { projectTag } = await params;
  const project = await getProjectDetail(projectTag);
  return { title: project?.name ?? "프로젝트" };
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const { projectTag } = await params;
  const project = await getProjectDetail(projectTag);
  if (!project) notFound();

  const activeTab = parseProjectDetailTab((await searchParams).tab);
  const tagColor = pickPaletteColor(project.tag);
  const due = formatMonthDayWeekday(project.dueDate);

  const teamActions = activeTab === "timeline" ? await getProjectTeamActions(project.tag) : [];
  const timelineItems: TimelineActionInput[] = teamActions.map((action) => ({
    id: action.id,
    title: action.name,
    tag: project.tag,
    tagBgColor: tagColor.bgColor,
    tagTextColor: tagColor.textColor,
    startDate: action.startDate,
    dueDate: action.dueDate,
    tone: isDelayed(action) ? "DELAYED" : action.status,
    // ⚠️ 팀 액션 상세(`/app/projects/:tag/team/:teamId`)는 아직 없다 — 생기면 이 href를 바꾼다.
    href: `/app/projects/${project.tag}/team/${encodeURIComponent(action.team)}`,
  }));

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs">
            <Link href="/app/projects" className="hover:text-foreground">
              프로젝트
            </Link>{" "}
            &gt; {project.name}
          </p>
          <h2 className="text-foreground text-base font-semibold">{project.name}</h2>
        </div>

        <nav aria-label="프로젝트 상세 탭" className="border-border flex gap-4 border-b">
          {PROJECT_DETAIL_TABS.map((t) => (
            <Link
              key={t.tab}
              href={
                t.tab === "plan"
                  ? `/app/projects/${project.tag}`
                  : `/app/projects/${project.tag}?tab=${t.tab}`
              }
              aria-current={activeTab === t.tab ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                activeTab === t.tab
                  ? "border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {activeTab === "plan" ? (
          <section className="border-border bg-card flex max-w-[720px] flex-col gap-3 rounded-xl border p-6">
            <div className="flex items-center gap-2 text-xs">
              <span
                className="rounded px-1.5 py-0.5 font-mono font-semibold"
                style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
              >
                {project.tag}
              </span>
              <span className="text-muted-foreground">마감 {due ? `${due}까지` : "-"}</span>
            </div>
            <h3 className="text-foreground text-lg font-semibold">{project.name}</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {project.description}
            </p>
            {project.attachmentName && (
              // ⚠️ 목 단계라 실제 다운로드 링크가 없다 — API 스펙 확정 후 연결.
              <a
                href="#"
                className="text-foreground inline-flex w-fit items-center gap-1.5 text-sm underline underline-offset-2"
              >
                <Paperclip className="size-3.5" />
                {project.attachmentName} 다운로드
              </a>
            )}
          </section>
        ) : (
          <section
            className="border-border bg-card flex flex-col overflow-hidden rounded-xl border"
            style={{ height: PROJECT_TIMELINE_BOX_HEIGHT }}
          >
            <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">팀 액션 타임라인</h3>
              <ActionTimelineLegend />
            </div>
            <ActionTimeline
              items={timelineItems}
              today={new Date()}
              emptyLabel="아직 하달된 팀 액션이 없습니다."
            />
          </section>
        )}
      </div>
    </main>
  );
}
