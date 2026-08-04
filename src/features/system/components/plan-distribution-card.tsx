import { PLAN, PLAN_LABEL } from "@/constants/domain";

import type { PlanDistributionSlice } from "../types";
import { PlanDonutChartLoader } from "./plan-donut-chart-loader";

/** 도넛 조각과 같은 색이다(`plan-donut-chart.tsx`의 `SLICE_COLOR`). */
const LEGEND_DOT_CLASS = {
  [PLAN.TEAM]: "bg-chart-1",
  [PLAN.FREE]: "bg-chart-2",
} as const;

/** "플랜 분포" 카드 — 도넛차트(클라이언트) + 범례(서버). */
export function PlanDistributionCard({ data }: { data: PlanDistributionSlice[] }) {
  return (
    <section className="border-border bg-card w-64 shrink-0 rounded-xl border p-5">
      <h2 className="text-foreground text-sm font-semibold">플랜 분포</h2>

      <div className="mt-3">
        <PlanDonutChartLoader data={data} />
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {data.map((slice) => (
          <li key={slice.plan} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className={`size-2 shrink-0 rounded-full ${LEGEND_DOT_CLASS[slice.plan]}`}
                aria-hidden
              />
              <span className="text-foreground">{PLAN_LABEL[slice.plan]}</span>
            </span>
            <span className="text-muted-foreground tabular-nums">{slice.companyCount}개사</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
