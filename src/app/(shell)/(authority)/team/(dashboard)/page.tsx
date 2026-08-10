import type { Metadata } from "next";

import { DashboardMeetingItem } from "@/components/common/dashboard-meeting-item";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/features/team/components/kpi-card";
import { MemberStatusRow } from "@/features/team/components/member-status-row";
import { MEMBER_BOX_MAX_HEIGHT } from "@/features/team/lib";
import { getTeamDashboardOverview } from "@/features/team/server";

export const metadata: Metadata = {
  title: "대시보드",
};

/** 표 머리 셀 — 규격은 DESIGN §3·§4(라벨 12px, 이름 열만 왼쪽). */
const HEAD_CELL_CLASS = "text-muted-foreground h-9 text-[12px] leading-4 font-normal";

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
          style={{ maxHeight: MEMBER_BOX_MAX_HEIGHT }}
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
            <p className="text-muted-foreground flex flex-1 items-center justify-center px-7 py-10 text-center text-[13px] leading-5 break-keep">
              아직 등록된 팀원이 없습니다.
            </p>
          ) : (
            <div className="scrollbar-hidden flex-1 overflow-auto [&_[data-slot=table-container]]:overflow-visible">
              <Table className="min-w-[560px] table-fixed text-[13px]">
                {/* 머리 띠·셀 규격은 오너 대시보드와 같다(DESIGN §3) — 두 화면이 같은 표다 */}
                <TableHeader>
                  <TableRow className="bg-foreground/[0.06] border-border hover:bg-foreground/[0.06] border-b">
                    <TableHead className={`${HEAD_CELL_CLASS} pl-6`}>이름</TableHead>
                    <TableHead className={`${HEAD_CELL_CLASS} text-center`}>직급</TableHead>
                    <TableHead className={`${HEAD_CELL_CLASS} text-center`}>역할</TableHead>
                    <TableHead className={`${HEAD_CELL_CLASS} text-center`}>담당 액션 수</TableHead>
                    <TableHead className={`${HEAD_CELL_CLASS} pr-6 text-center`}>상태</TableHead>
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

        {/* 높이를 고정하지 않는다 — 다섯 건이 하드 캡이라 자라 봐야 다섯 줄이다(`lib.ts` 참고) */}
        <section className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border">
          <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              최근 팀 회의
            </h2>
            <span className="text-muted-foreground text-[12px] leading-4">최신 5건</span>
          </div>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center px-7 py-10 text-center text-[13px] leading-5 break-keep">
              예정된 팀 회의가 없습니다.
            </p>
          ) : (
            <ul>
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
