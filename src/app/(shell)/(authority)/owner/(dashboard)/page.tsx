import type { Metadata } from "next";
import Link from "next/link";

import { DashboardMeetingItem } from "@/components/common/dashboard-meeting-item";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/features/owner/components/kpi-card";
import { LeaderStatusRow } from "@/features/owner/components/leader-status-row";
import { getDaysUntilDue, LEADER_BOX_MAX_HEIGHT } from "@/features/owner/lib";
import { getOwnerDashboardOverview } from "@/features/owner/server";

export const metadata: Metadata = {
  title: "대시보드",
};

/** 표 머리 셀 — 규격은 DESIGN §3·§4(라벨 12px, 이름 열만 왼쪽). */
const HEAD_CELL_CLASS = "text-muted-foreground h-9 text-[12px] leading-4 font-normal";

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
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/*
          ⚠️ 높이를 고정하지 않는다 — 내용만큼 자라고, 팀이 많아질 때만 위 한도에서 멈춘다
             (`LEADER_BOX_MAX_HEIGHT`). 고정 높이였을 때는 팀장이 넷이라 바닥이 90px 비었다.
        */}
        <section
          className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border"
          style={{ maxHeight: LEADER_BOX_MAX_HEIGHT }}
        >
          <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              팀장 현황
            </h2>
            {/* 카드 제목 줄 오른쪽 끝은 보조 정보 한 줄이다(DESIGN §2) */}
            <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
              전체 {leaderRows.length}팀
            </p>
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
              <Table className="min-w-[560px] table-fixed text-[13px]">
                {/*
                  ⚠️ 머리 줄에 **띠**를 깐다(DESIGN §3) — 보더만으로는 머리와 본문이 같은 면으로
                     읽힌다. `--secondary`는 흰 카드와 2%밖에 차이가 없어 안 보이므로 먹색을
                     옅게 깐다(행 hover가 4%라 그보다 진한 6%다).
                  ⚠️ 높이는 **셀에** 건다. `<tr>`에 걸면 `TableHead`의 기본 `h-10`이 이겨서
                     안 먹는다 — 행 높이를 정하는 건 셀이다.
                */}
                <TableHeader>
                  <TableRow className="bg-foreground/[0.06] border-border hover:bg-foreground/[0.06] border-b">
                    <TableHead className={`${HEAD_CELL_CLASS} pl-6`}>이름</TableHead>
                    <TableHead className={`${HEAD_CELL_CLASS} text-center`}>이메일</TableHead>
                    <TableHead className={`${HEAD_CELL_CLASS} text-center`}>팀</TableHead>
                    <TableHead className={`${HEAD_CELL_CLASS} text-center`}>상태</TableHead>
                    <TableHead className={`${HEAD_CELL_CLASS} pr-6 text-center`}>
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

        {/* ⚠️ 여기도 높이를 고정하지 않는다 — 다섯 건이 하드 캡이라 자라 봐야 다섯 줄이다.
            고정했을 때는 머리 줄 높이를 20px 적게 잡아 **마지막 줄이 잘려** 나갔다. */}
        <section className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border">
          <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              최근 프로젝트 회의
            </h2>
            <Link
              href="/app/meeting"
              className="text-muted-foreground hover:text-foreground text-[12px] leading-4 transition-colors"
            >
              전체 보기 →
            </Link>
          </div>
          {projectMeetings.length === 0 ? (
            <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              예정된 프로젝트 회의가 없습니다.
            </p>
          ) : (
            <ul>
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
