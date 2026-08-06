import { Folder, User, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActionDetailInfoCard,
  type ActionDetailInfoItem,
} from "@/components/common/action-detail-info-card";
import { formatMeetingDate } from "@/components/common/dashboard-meeting-item";
import { isDelayed } from "@/constants/domain";
import type { TimelineActionInput } from "@/features/member/action-timeline";
import { ActionTimeline, ActionTimelineLegend } from "@/features/member/components/action-timeline";
import {
  parseTeamActionDetailTab,
  TEAM_ACTION_DETAIL_TABS,
  TEAM_ACTION_TIMELINE_BOX_HEIGHT,
} from "@/features/project/lib";
import {
  getProjectDetail,
  getTeamActionDetail,
  getTeamActionPersonalItems,
} from "@/features/project/server";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

interface TeamActionDetailPageProps {
  params: Promise<{ projectId: string; teamActionId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: TeamActionDetailPageProps): Promise<Metadata> {
  const { teamActionId } = await params;
  const teamAction = await getTeamActionDetail(teamActionId);
  return { title: teamAction?.name ?? "팀 액션" };
}

export default async function TeamActionDetailPage({
  params,
  searchParams,
}: TeamActionDetailPageProps) {
  const { projectId, teamActionId } = await params;
  const [teamAction, project] = await Promise.all([
    getTeamActionDetail(teamActionId),
    getProjectDetail(projectId),
  ]);
  // ⚠️ 팀 액션이 이 프로젝트에 속하지 않으면(다른 프로젝트의 id를 끼워 넣은 경우) 404 —
  //    팀 액션 id만으로도 찾아지지만 URL의 projectId와 어긋나면 잘못된 경로다.
  if (!teamAction || !project || teamAction.projectId !== project.id) notFound();

  const activeTab = parseTeamActionDetailTab((await searchParams).tab);
  const tagColor = pickPaletteColor(teamAction.projectTag);

  const personalItems =
    activeTab === "timeline" ? await getTeamActionPersonalItems(teamActionId) : [];
  const timelineItems: TimelineActionInput[] = personalItems.map((item) => {
    // ⚠️ 이 화면은 담당자별 행이라(WORKFLOW.md §4) 칩에 액션명이 아니라 담당자 이름(역할)을 단다.
    const assignee = item.assigneeRoleLabel
      ? `${item.assigneeName}(${item.assigneeRoleLabel})`
      : item.assigneeName;
    return {
      id: String(item.id),
      title: item.title,
      tag: assignee,
      tagBgColor: "var(--muted)",
      tagTextColor: "var(--muted-foreground)",
      startDate: item.startDate,
      dueDate: item.dueDate,
      tone: isDelayed(item) ? "DELAYED" : item.status,
      // ⚠️ 개인 액션 상세(`/app/actions/:id`)는 아직 없다 — 생기면 href를 채운다.
    };
  });

  const infoItems: ActionDetailInfoItem[] = [
    {
      key: "assignee",
      icon: User,
      label: "담당자",
      content: `${teamAction.assigneeName}(${teamAction.assigneeRoleLabel})`,
    },
    {
      key: "source-meeting",
      icon: Video,
      label: "출처 회의",
      // ⚠️ 회의 상세(`/app/meeting/:id`) 라우트가 아직 없어 href 없이 텍스트만(§9 화면은 사실만).
      content: (
        <>
          <div className="flex items-center gap-1.5">
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {teamAction.projectTag}
            </span>
            <p className="truncate">{teamAction.sourceMeeting.title}</p>
          </div>
          <p className="text-muted-foreground text-[11px] leading-4">
            {formatMeetingDate(teamAction.sourceMeeting.scheduledAt)}
          </p>
        </>
      ),
    },
    // ⚠️ 상위 팀 액션 — 팀 액션 상세엔 없음(개인 액션 상세에서만 씀).
    {
      key: "project",
      icon: Folder,
      label: "관련 프로젝트",
      content: (
        <>
          <div className="flex items-center gap-1.5">
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {project.tag}
            </span>
            <p className="truncate">{project.name}</p>
          </div>
          <p className="text-muted-foreground text-[11px] leading-4">
            마감 {formatMonthDayWeekday(project.dueDate) ?? "-"}까지
          </p>
        </>
      ),
      href: `/app/projects/${project.id}`,
    },
  ];

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-[11px] leading-4">
            <Link href="/app/projects" className="hover:text-foreground">
              프로젝트
            </Link>{" "}
            &gt;{" "}
            <Link href={`/app/projects/${project.id}`} className="hover:text-foreground">
              {project.name}
            </Link>{" "}
            &gt; {teamAction.name}
          </p>
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-xl leading-7 font-semibold tracking-[-0.4px]">
              {teamAction.name}
            </h2>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-xs font-semibold"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {teamAction.projectTag}
            </span>
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-semibold">
              {teamAction.team}
            </span>
          </div>
        </div>

        <nav aria-label="팀 액션 상세 탭" className="border-border flex gap-4 border-b">
          {TEAM_ACTION_DETAIL_TABS.map((t) => (
            <Link
              key={t.tab}
              href={
                t.tab === "detail"
                  ? `/app/projects/${project.id}/team/${teamAction.id}`
                  : `/app/projects/${project.id}/team/${teamAction.id}?tab=${t.tab}`
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

        {activeTab === "detail" ? (
          // ⚠️ 세부 정보 카드는 이 탭에만 있다(타임라인 탭엔 없음) — sticky라 곁 컬럼을
          //    items-start로 둔다. DESIGN.md §1의 "items-start 쓰지 않는다"는 컬럼을 늘여
          //    채우는 화면 얘기고, 여긴 반대로 카드가 위에 붙어 있어야 한다.
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="border-border bg-card min-w-0 rounded-2xl border p-7">
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {teamAction.description}
              </p>
            </section>
            <ActionDetailInfoCard items={infoItems} />
          </div>
        ) : (
          <section
            className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border"
            style={{ height: TEAM_ACTION_TIMELINE_BOX_HEIGHT }}
          >
            <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
              <h3 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
                <span className="bg-foreground size-2 rounded-full" aria-hidden />
                개인 액션 타임라인
              </h3>
              <ActionTimelineLegend />
            </div>
            <ActionTimeline
              items={timelineItems}
              today={new Date()}
              emptyLabel="아직 하달된 개인 액션이 없습니다."
            />
          </section>
        )}
      </div>
    </main>
  );
}
