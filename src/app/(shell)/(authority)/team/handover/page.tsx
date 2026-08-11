import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { HANDOVER_TYPE_LABEL } from "@/constants/domain";
import { listTeamHandovers } from "@/features/team-handover/server";
import { formatMonthDayWeekday } from "@/lib/date";

export const metadata: Metadata = {
  title: "인수인계서 관리",
};

/**
 * 팀원(신청자) 인수인계서 목록 — 팀장 중간 승인을 기다리는 신청만 보인다
 * (WORKFLOW.md §7). 이미 중간 승인된 건은 오너의 최종 승인 대기로 넘어가 여기서 할 일이 없다.
 * ⚠️ 세션이 없어(§team-handover/server.ts) 지금은 고정 스코프(김서준·개발팀)로 렌더링한다 —
 *    `/team/(dashboard)`와 같은 전례.
 */
export default async function TeamHandoverPage() {
  const items = await listTeamHandovers();

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="border-border text-muted-foreground bg-secondary/50 flex items-center gap-4 border-b px-6 py-3 text-[12px] leading-4">
            <span className="min-w-0 flex-1">인수인계서명</span>
            <span className="w-28 shrink-0">담당자</span>
            <span className="w-20 shrink-0">유형</span>
            <span className="w-40 shrink-0">기간</span>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="처리할 인수인계서가 없습니다."
              description="팀원이 휴직·오프보딩을 신청하면 이 자리에 올라옵니다."
            />
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id} className="border-border border-b last:border-b-0">
                  <Link
                    href={`/team/handover/${item.id}`}
                    className="hover:bg-muted/50 flex items-center gap-4 px-6 py-3.5 text-[13px] leading-5 transition-colors"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {item.memberName} · {HANDOVER_TYPE_LABEL[item.type]} 인수인계서
                    </span>
                    <span className="text-muted-foreground w-28 shrink-0 truncate">
                      {item.memberName}
                    </span>
                    <span className="text-muted-foreground w-20 shrink-0">
                      {HANDOVER_TYPE_LABEL[item.type]}
                    </span>
                    <span className="text-muted-foreground w-40 shrink-0 tabular-nums">
                      {item.period
                        ? `${formatMonthDayWeekday(item.period.from)} ~ ${formatMonthDayWeekday(item.period.to)}`
                        : "-"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
