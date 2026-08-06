import type { Metadata } from "next";

import { DashboardMeetingItem } from "@/components/common/dashboard-meeting-item";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/features/team/components/kpi-card";
import { MemberStatusRow } from "@/features/team/components/member-status-row";
import { MEETING_BOX_HEIGHT, MEMBER_BOX_HEIGHT } from "@/features/team/lib";
import { getTeamDashboardOverview } from "@/features/team/server";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function TeamDashboardPage() {
  const {
    teamName,
    teamActionCount,
    memberActionCount,
    myActionCount,
    doneActionCount,
    members,
    meetings,
  } = await getTeamDashboardOverview();

  const kpis = [
    { label: "팀 액션", value: String(teamActionCount), sub: "진행 중" },
    {
      label: "팀원 액션",
      value: String(memberActionCount),
      sub: "팀 액션 기준",
      tone: "accent" as const,
    },
    { label: "내 액션", value: String(myActionCount), sub: "처리 예정" },
    { label: "완료 액션", value: String(doneActionCount), sub: "내 누적" },
  ];

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <section
          className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border"
          style={{ height: MEMBER_BOX_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              팀원 현황
            </h2>
            <span className="text-muted-foreground text-[12px] leading-4">
              {teamName} · {members.length}명
            </span>
          </div>
          {members.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              아직 등록된 팀원이 없습니다.
            </p>
          ) : (
            <div className="scrollbar-hidden flex-1 overflow-auto [&_[data-slot=table-container]]:overflow-visible">
              <Table className="min-w-[560px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground pl-4 text-xs">이름</TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      직급
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      역할
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      담당 액션 수
                    </TableHead>
                    <TableHead className="text-muted-foreground pr-4 text-center text-xs">
                      상태
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <MemberStatusRow key={member.id} member={member} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section
          className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border"
          style={{ height: MEETING_BOX_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              최근 팀 회의
            </h2>
            <span className="text-muted-foreground text-[12px] leading-4">최신 5건</span>
          </div>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              예정된 팀 회의가 없습니다.
            </p>
          ) : (
            <ul className="flex-1 overflow-hidden">
              {meetings.map((meeting, index) => (
                <DashboardMeetingItem key={meeting.id} meeting={meeting} showDivider={index > 0} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
