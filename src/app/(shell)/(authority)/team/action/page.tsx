import type { Metadata } from "next";

import { isDelayed } from "@/constants/domain";
import { getTeamActionsGroupedByProject } from "@/features/action/server";
import type { TeamActionProjectGroup, TeamActionTimelineItem } from "@/features/action/types";
import type { TimelineActionInput } from "@/features/member/action-timeline";
import { ActionTimeline, ActionTimelineLegend } from "@/features/member/components/action-timeline";
import { pickPaletteColor } from "@/lib/palette";

export const metadata: Metadata = {
  title: "팀 액션",
};

/** 이 프로젝트의 팀 액션들을 타임라인 입력으로 — 프로젝트 상세 타임라인 탭과 같은 모양(§디자인). */
function toTimelineItems(
  group: TeamActionProjectGroup,
  teamActions: TeamActionTimelineItem[],
): TimelineActionInput[] {
  const tagColor = pickPaletteColor(group.projectTag);
  return teamActions.map((action) => ({
    id: String(action.id),
    title: action.name,
    tag: group.projectTag,
    tagBgColor: tagColor.bgColor,
    tagTextColor: tagColor.textColor,
    startDate: action.startDate,
    dueDate: action.dueDate,
    tone: isDelayed(action) ? "DELAYED" : action.status,
    href: `/app/projects/${group.projectId}/team/${action.id}`,
  }));
}

export default async function TeamActionPage() {
  const groups = await getTeamActionsGroupedByProject();
  const totalTeamActions = groups.reduce((sum, group) => sum + group.teamActions.length, 0);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <p className="text-muted-foreground self-end text-xs tabular-nums">
          {groups.length}개 프로젝트 · 총 {totalTeamActions}개 팀 액션
        </p>

        {groups.length === 0 ? (
          <p className="text-muted-foreground flex min-h-[240px] items-center justify-center text-sm">
            아직 하달된 팀 액션이 없습니다.
          </p>
        ) : (
          groups.map((group) => {
            const tagColor = pickPaletteColor(group.projectTag);
            return (
              <section
                key={group.projectId}
                className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border"
              >
                <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
                  <h3 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
                    <span className="bg-foreground size-2 rounded-full" aria-hidden />
                    {group.projectName}
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-xs leading-none font-semibold"
                      style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
                    >
                      {group.projectTag}
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
                    {group.teamActions.length}개 팀 액션
                  </p>
                </div>
                <ActionTimeline
                  items={toTimelineItems(group, group.teamActions)}
                  today={new Date()}
                />
              </section>
            );
          })
        )}

        <ActionTimelineLegend />
      </div>
    </main>
  );
}
