import type { Metadata } from "next";

import { DashboardMeetingItem } from "@/components/common/dashboard-meeting-item";
import { MemberActionItem } from "@/features/member/components/member-action-item";
import { DUE_SOON_BOX_MIN_HEIGHT, MEETING_BOX_HEIGHT } from "@/features/member/lib";
import { getMemberDashboardOverview } from "@/features/member/server";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function MemberDashboardPage() {
  const { dueSoonActions, attendedMeetings } = await getMemberDashboardOverview();

  return (
    <main className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-7">
      <div className="mx-auto flex min-h-0 w-full max-w-[1080px] flex-1 flex-col gap-4">
        {/* D-7 액션 — 남는 세로 공간을 채우고(최소 높이 보장) 넘치면 내부 스크롤 */}
        <section
          className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border"
          style={{ minHeight: DUE_SOON_BOX_MIN_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">D-7 액션</h2>
            <span className="text-muted-foreground text-xs">마감 임박·연체</span>
          </div>
          {dueSoonActions.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              마감이 임박한 액션이 없습니다.
            </p>
          ) : (
            <ul className="scrollbar-hidden flex-1 overflow-y-auto">
              {dueSoonActions.map((action, index) => (
                <MemberActionItem key={action.id} action={action} showDivider={index > 0} />
              ))}
            </ul>
          )}
        </section>

        {/* 참석 회의 — 최신 5건 고정 */}
        <section
          className="border-border bg-card flex shrink-0 flex-col overflow-hidden rounded-xl border"
          style={{ height: MEETING_BOX_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">참석 회의</h2>
            <span className="text-muted-foreground text-xs">최신 5건</span>
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
