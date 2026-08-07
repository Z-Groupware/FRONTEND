import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { OrgSummary } from "../org-types";

/**
 * 지금 회사가 어떤 상태인가 — **화면 맨 위 한 장**(§DESIGN 1: 상태 → 근거 → 조작).
 *
 * ⚠️ 세 칸은 **세로선으로만** 가른다. 카드 안에 카드를 얹지 않는다(§DESIGN 2).
 * ⚠️ 숫자는 **검색과 무관하게 회사 전체**다. 검색어를 넣었다고 여기까지 줄면
 *    "우리 회사가 3명"으로 읽힌다.
 */

function SummaryCell({
  label,
  value,
  unit,
  hint,
  hasDivider,
}: {
  label: string;
  value: number;
  unit: string;
  hint: ReactNode;
  hasDivider: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 lg:px-6",
        hasDivider && "border-border lg:border-l",
      )}
    >
      <p className="text-muted-foreground text-[12px] leading-4">{label}</p>
      <p className="text-[30px] leading-9 font-semibold tracking-[-0.8px] tabular-nums">
        {value}
        <span className="pl-1 text-[15px] leading-6 font-medium tracking-normal">{unit}</span>
      </p>
      <p className="text-muted-foreground/70 text-[11px] leading-4">{hint}</p>
    </div>
  );
}

export function OrgSummaryCard({ summary }: { summary: OrgSummary }) {
  return (
    <section className="border-border bg-card rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          우리 회사
        </h2>
      </div>

      <div className="grid gap-6 px-7 pt-2 pb-7 lg:grid-cols-3 lg:items-center lg:gap-0">
        <SummaryCell
          label="전체 구성원"
          value={summary.totalCount}
          unit="명"
          hint="대표 포함"
          hasDivider={false}
        />
        <SummaryCell
          label="팀"
          value={summary.teamCount}
          unit="개"
          hint="팀마다 팀장 한 명"
          hasDivider
        />
        {/*
          ⚠️ 휴직을 세는 건 **일을 맡기기 전에 알아야 하는 값**이라서다. 지금 자리에 없는
             사람에게 액션이 가면 마감까지 아무도 모른다(§인수인계).
          ⚠️ 승인 대기는 **안 센다.** 아직 아무 일도 일어나지 않았고, 그건 대표·관리자가
             사원 관리에서 다룰 일이다(WORKFLOW §7).
        */}
        <SummaryCell
          label="휴직"
          value={summary.vacationCount}
          unit="명"
          hint={summary.vacationCount === 0 ? "모두 자리에 있습니다" : "지금 자리에 없습니다"}
          hasDivider
        />
      </div>
    </section>
  );
}
