import { Folder, GitBranch, User, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActionDetailInfoCard,
  type ActionDetailInfoItem,
} from "@/components/common/action-detail-info-card";
import { formatMeetingDate } from "@/components/common/dashboard-meeting-item";
import { getPersonalActionDetail } from "@/features/action/server";
import { getProjectDetail } from "@/features/project/server";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";

interface PersonalActionDetailPageProps {
  params: Promise<{ actionId: string }>;
}

export async function generateMetadata({
  params,
}: PersonalActionDetailPageProps): Promise<Metadata> {
  const { actionId } = await params;
  const action = await getPersonalActionDetail(actionId);
  return { title: action?.name ?? "액션" };
}

export default async function PersonalActionDetailPage({ params }: PersonalActionDetailPageProps) {
  const { actionId } = await params;
  const action = await getPersonalActionDetail(actionId);
  if (!action) notFound();

  const project = await getProjectDetail(String(action.projectId));
  if (!project) notFound();

  const tagColor = pickPaletteColor(action.projectTag);

  const infoItems: ActionDetailInfoItem[] = [
    {
      key: "assignee",
      icon: User,
      label: "담당자",
      content: `${action.assigneeName}(${action.assigneeRoleLabel})`,
    },
    {
      key: "source-meeting",
      icon: Video,
      label: "출처 회의",
      // ⚠️ 회의 상세(`/app/meeting/:id`) 라우트가 아직 없어 href 없이 텍스트만(§9 화면은 사실만).
      content: (
        <>
          <div className="flex items-center gap-1.5">
            <p className="truncate">{action.sourceMeeting.title}</p>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {action.projectTag}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-4">
            {formatMeetingDate(action.sourceMeeting.scheduledAt)}
          </p>
        </>
      ),
    },
    {
      key: "parent-team-action",
      icon: GitBranch,
      label: "상위 팀 액션",
      content: (
        <>
          <div className="flex items-center gap-1.5">
            <p className="truncate">{action.parentTeamAction.name}</p>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {action.projectTag}
            </span>
            <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold">
              {action.parentTeamAction.team}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-4">
            {formatMonthDayWeekday(action.parentTeamAction.dueDate) ?? "-"}까지
          </p>
        </>
      ),
      href: `/app/projects/${action.projectId}/team/${action.parentTeamAction.id}`,
    },
    {
      key: "project",
      icon: Folder,
      label: "관련 프로젝트",
      content: (
        <>
          <div className="flex items-center gap-1.5">
            <p className="truncate">{project.name}</p>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {project.tag}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-4">
            {formatMonthDayWeekday(project.dueDate) ?? "-"}까지
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
            &gt;{" "}
            <Link
              href={`/app/projects/${project.id}/team/${action.parentTeamAction.id}`}
              className="hover:text-foreground"
            >
              {action.parentTeamAction.name}
            </Link>{" "}
            &gt; {action.name}
          </p>
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-xl leading-7 font-semibold tracking-[-0.4px]">
              {action.name}
            </h2>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-xs leading-none font-semibold"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {action.projectTag}
            </span>
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs leading-none font-semibold">
              {action.team}
            </span>
          </div>
        </div>

        {/* ⚠️ 세부 정보 카드는 sticky라 곁 컬럼을 items-start로 둔다 — 팀 액션 상세와 같은 이유. */}
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="border-border bg-card min-w-0 rounded-2xl border p-7">
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {action.description}
            </p>
          </section>
          <ActionDetailInfoCard items={infoItems} />
        </div>
      </div>
    </main>
  );
}
