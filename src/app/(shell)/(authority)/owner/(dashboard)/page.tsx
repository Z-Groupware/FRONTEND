import type { Metadata } from "next";
import Link from "next/link";

import { DashboardMeetingItem } from "@/components/common/dashboard-meeting-item";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/features/owner/components/kpi-card";
import { LeaderStatusRow } from "@/features/owner/components/leader-status-row";
import { getDaysUntilDue, LEADER_BOX_HEIGHT, MEETING_BOX_HEIGHT } from "@/features/owner/lib";
import { getOwnerDashboardOverview } from "@/features/owner/server";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function OwnerDashboardPage() {
  const { projects, activeMemberCount, onLeaveMemberCount, leaderRows, projectMeetings } =
    await getOwnerDashboardOverview();

  const imminentProjectCount = projects.filter((project) => {
    const daysUntilDue = getDaysUntilDue(project.dueDate);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  }).length;

  const kpis = [
    { label: "전체 프로젝트", value: String(projects.length), sub: "진행 중" },
    {
      label: "마감 D-7",
      value: String(imminentProjectCount),
      sub: "즉시 확인 필요",
      tone: "danger" as const,
    },
    { label: "전체 사원", value: String(activeMemberCount), sub: "재직 중" },
    {
      label: "휴직자",
      value: String(onLeaveMemberCount),
      sub: "현재 휴직",
      tone: "warning" as const,
    },
  ];

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <section
          className="border-border bg-card flex flex-col overflow-hidden rounded-xl border"
          style={{ height: LEADER_BOX_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-center border-b px-4 py-3">
            <h2 className="text-sm font-semibold">팀장 현황</h2>
          </div>
          {leaderRows.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              아직 등록된 팀장이 없습니다.
            </p>
          ) : (
            // 가로·세로 스크롤을 모두 이 컨테이너가 갖고(스크롤바 숨김), 좁은 화면에서 컬럼이
            // 과도하게 줄지 않게 테이블에 최소 폭을 준다. shadcn Table이 자체적으로 두는
            // table-container(overflow-x-auto)를 visible로 눌러 스크롤 소유권을 여기로 넘긴다.
            <div className="scrollbar-hidden flex-1 overflow-auto [&_[data-slot=table-container]]:overflow-visible">
              <Table className="min-w-[560px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground pl-4 text-xs">이름</TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      이메일
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      부서
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      상태
                    </TableHead>
                    <TableHead className="text-muted-foreground pr-4 text-center text-xs">
                      휴직기간
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderRows.map((leader) => (
                    <LeaderStatusRow key={leader.id} leader={leader} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section
          className="border-border bg-card flex flex-col overflow-hidden rounded-xl border"
          style={{ height: MEETING_BOX_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">최근 프로젝트 회의</h2>
            <Link
              href="/app/meeting"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              전체 보기 →
            </Link>
          </div>
          {projectMeetings.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              예정된 프로젝트 회의가 없습니다.
            </p>
          ) : (
            <ul className="flex-1 overflow-hidden">
              {projectMeetings.map((meeting, index) => (
                <DashboardMeetingItem key={meeting.id} meeting={meeting} showDivider={index > 0} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
