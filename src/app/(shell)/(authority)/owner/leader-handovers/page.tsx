import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LEADER_HANDOVER_CUSTODY_STATUS,
  LEADER_HANDOVER_CUSTODY_STATUS_LABEL,
} from "@/constants/domain";
import {
  LEADER_HANDOVER_FILTER_TABS,
  parseCustodyFilter,
  toCustodyStatus,
} from "@/features/leader-handover/lib";
import { listLeaderHandovers } from "@/features/leader-handover/server";
import { getViewer } from "@/features/shell/viewer";
import { formatMonthDayWeekday } from "@/lib/date";
import { canManageLeaderHandovers } from "@/lib/permission";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "팀장급 인수인계서 관리",
};

interface LeaderHandoversPageProps {
  searchParams: Promise<{ status?: string }>;
}

/**
 * 팀장급 인수인계서 관리 — 오프보딩 최종 승인이 끝난 뒤 담당자 없이 남는 개인 액션
 * 뭉치를 새 팀장에게 넘길 때까지 모아 보여준다(WORKFLOW.md §7).
 * ⚠️ **오프보딩만** 올라온다 — 팀장 휴직은 본인이 재할당을 마치고 올라가 여기 없다.
 * ⚠️ 사원 관리 최종 승인과의 실제 연동은 범위 밖이다(고정 mock, 2026-08-08 사용자 확인).
 */
export default async function LeaderHandoversPage({ searchParams }: LeaderHandoversPageProps) {
  const viewer = await getViewer();
  if (!canManageLeaderHandovers(viewer)) notFound();

  const params = await searchParams;
  const activeFilter = parseCustodyFilter(params.status);
  const items = await listLeaderHandovers(toCustodyStatus(activeFilter));

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <nav aria-label="귀속 상태 필터" className="flex items-center gap-1">
          {LEADER_HANDOVER_FILTER_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={
                tab.value === "all"
                  ? "/owner/leader-handovers"
                  : `/owner/leader-handovers?status=${tab.value}`
              }
              aria-current={activeFilter === tab.value ? "page" : undefined}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[13px] leading-5 transition-colors",
                activeFilter === tab.value
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="border-border text-muted-foreground flex items-center gap-4 border-b px-6 py-3 text-[12px] leading-4">
            <span className="min-w-0 flex-1">인수인계서명</span>
            <span className="w-28 shrink-0">퇴사 팀장</span>
            <span className="w-28 shrink-0">팀</span>
            <span className="w-32 shrink-0">오프보딩 승인일</span>
            <span className="w-20 shrink-0 text-right">상태</span>
          </div>

          {items.length === 0 ? (
            <p className="text-muted-foreground px-6 py-10 text-center text-[13px] leading-5">
              해당하는 인수인계서가 없습니다.
            </p>
          ) : (
            <ul>
              {items.map((item) => {
                const isAssigned = item.custodyStatus === LEADER_HANDOVER_CUSTODY_STATUS.ASSIGNED;
                return (
                  <li key={item.id} className="border-border border-b last:border-b-0">
                    <Link
                      href={`/owner/leader-handovers/${item.id}`}
                      className="hover:bg-muted/50 flex items-center gap-4 px-6 py-3.5 text-[13px] leading-5 transition-colors"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                      <span className="text-muted-foreground w-28 shrink-0 truncate">
                        {item.formerLeaderName}
                      </span>
                      <span className="text-muted-foreground w-28 shrink-0 truncate">
                        {item.teamName}
                      </span>
                      <span className="text-muted-foreground w-32 shrink-0 tabular-nums">
                        {formatMonthDayWeekday(item.offboardingApprovedAt)}
                      </span>
                      <span
                        className={cn(
                          "w-20 shrink-0 rounded border px-2 py-0.5 text-center text-[11px] leading-4",
                          isAssigned
                            ? "border-border/50 text-muted-foreground/60"
                            : "border-foreground/35 bg-foreground/[0.06] text-foreground font-medium",
                        )}
                      >
                        {LEADER_HANDOVER_CUSTODY_STATUS_LABEL[item.custodyStatus]}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
