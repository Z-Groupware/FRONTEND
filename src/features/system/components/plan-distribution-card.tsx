import { PLAN, PLAN_LABEL } from "@/constants/domain";

import type { PlanDistributionSlice } from "../types";
import { PlanDonutChartLoader } from "./plan-donut-chart-loader";

/** 도넛 조각과 같은 명도다(`plan-donut-chart.tsx`의 `SLICE_OPACITY`) — 색이 아니라 명도로 가른다. */
const LEGEND_DOT_CLASS = {
  [PLAN.TEAM]: "bg-foreground",
  [PLAN.FREE]: "bg-foreground/35",
} as const;

/**
 * "플랜 분포" 카드 — 도넛차트(클라이언트) + 범례(서버).
 *
 * ⚠️ **폭은 페이지 격자가 정한다**(곁 컬럼 360px, DESIGN §1). 여기서 `lg:w-64`로 또 정하고
 *    있었는데, 격자와 둘이 싸워 도넛이 눌린 채로 그려졌다.
 */
export function PlanDistributionCard({ data }: { data: PlanDistributionSlice[] }) {
  return (
    <section className="border-border bg-card w-full rounded-2xl border">
      <h2 className="flex items-center gap-2 px-7 pt-6 pb-3 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        플랜 분포
      </h2>

      <div className="px-7">
        <PlanDonutChartLoader data={data} />
      </div>

      <ul className="mt-4 flex flex-col gap-2 px-7 pb-6">
        {data.map((slice) => (
          <li key={slice.plan} className="flex items-center justify-between text-[13px] leading-5">
            <span className="flex items-center gap-2">
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
