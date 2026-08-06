import type { Metadata } from "next";

import { DashboardMeetingItem } from "@/components/common/dashboard-meeting-item";
import { isDelayed } from "@/constants/domain";
import type { TimelineActionInput } from "@/features/member/action-timeline";
import { ActionTimeline, ActionTimelineLegend } from "@/features/member/components/action-timeline";
import { DUE_SOON_BOX_MIN_HEIGHT, MEETING_BOX_HEIGHT } from "@/features/member/lib";
import { getMemberDashboardOverview } from "@/features/member/server";
import { pickPaletteColor } from "@/lib/palette";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function MemberDashboardPage() {
  const { dueSoonActions, attendedMeetings } = await getMemberDashboardOverview();

  // 지연은 상태가 아니라 마감 경과 파생값이라 여기서 계산해 tone으로 넘긴다(§도메인 상수).
  const timelineItems: TimelineActionInput[] = dueSoonActions.map((action) => {
    const tagColor = pickPaletteColor(action.projectTag);
    return {
      id: action.id,
      title: action.title,
      tag: action.projectTag,
      tagBgColor: tagColor.bgColor,
      tagTextColor: tagColor.textColor,
      startDate: action.startDate,
      dueDate: action.dueDate,
      tone: isDelayed(action) ? "DELAYED" : action.status,
      href: `/app/actions/${action.id}`,
    };
  });

  return (
    <main className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-7">
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-7">
        {/* 처리할 액션 — 시작일→마감일 기간 타임라인. 남는 세로 공간을 채우고 넘치면 내부 스크롤 */}
        <section
          className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border"
          style={{ minHeight: DUE_SOON_BOX_MIN_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              처리할 액션
            </h2>
            <ActionTimelineLegend />
          </div>
          <ActionTimeline
            items={timelineItems}
            today={new Date()}
            emptyLabel="처리할 액션이 없습니다."
          />
        </section>

        {/* 참석 회의 — 최신 5건 고정 */}
        <section
          className="border-border bg-card flex shrink-0 flex-col overflow-hidden rounded-2xl border"
          style={{ height: MEETING_BOX_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              참석 회의
            </h2>
            <span className="text-muted-foreground text-[12px] leading-4">최신 5건</span>
          </div>
          {attendedMeetings.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              참석할 회의가 없습니다.
            </p>
          ) : (
            <ul className="flex-1 overflow-hidden">
              {attendedMeetings.map((meeting, index) => (
                <DashboardMeetingItem key={meeting.id} meeting={meeting} showDivider={index > 0} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
