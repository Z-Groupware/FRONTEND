import { PLAN, PLAN_LABEL } from "@/constants/domain";

import type { PlanDistributionSlice } from "../types";
import { PlanDonutChartLoader } from "./plan-donut-chart-loader";

/**
 * 범례 점 — **도넛 조각과 같은 색**이어야 한다(`plan-donut-chart.tsx`의 `SLICE_FILL`).
 * ⚠️ 둘이 어긋나면 범례가 어느 조각을 가리키는지 알 수 없다. 고칠 때 같이 고친다.
 */
const LEGEND_DOT_CLASS = {
  [PLAN.TEAM]: "bg-chart-1",
  [PLAN.FREE]: "bg-foreground/35",
} as const;

/**
 * "플랜 분포" 카드 — 도넛차트(클라이언트) + 범례(서버).
 *
 * ⚠️ **폭은 페이지 격자가 정한다**(곁 컬럼 360px, DESIGN §1). 여기서 `lg:w-64`로 또 정하고
 *    있었는데, 격자와 둘이 싸워 도넛이 눌린 채로 그려졌다.
 * ⚠️ **남는 높이는 도넛이 먹는다**(§1 "`items-start`를 쓰지 않는다"). 옆 차트 카드가 더 길어서
 *    이 카드는 늘 아래가 남는데, 내용을 위에 몰아 두면 오른쪽 아래가 통째로 빈다 —
 *    도넛을 가운데로 띄우고 범례를 바닥에 붙이면 그 빈 칸이 사라진다.
 */
export function PlanDistributionCard({ data }: { data: PlanDistributionSlice[] }) {
  return (
    <section className="border-border bg-card flex w-full flex-col rounded-2xl border">
      <h2 className="flex items-center gap-2 px-7 pt-6 pb-3 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        플랜 분포
      </h2>

      {/*
        ⚠️ recharts가 차트 표면에 `tabindex`를 붙여서, **클릭만 해도** 브라우저 기본 테두리가
           차트 전체를 감싼다 — 고른 것도 아닌데 선택된 것처럼 보인다.
        ⚠️ 그렇다고 통째로 끄면 키보드로 다니는 사람이 지금 어디 있는지 알 수 없다(§a11y).
           `:focus-visible`에만 링을 남겨, 마우스로는 안 뜨고 키보드로는 뜬다.
      */}
      <div className="[&_.recharts-surface:focus-visible]:outline-ring flex flex-1 items-center justify-center px-7 py-2 [&_.recharts-surface]:outline-none [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-2">
        <PlanDonutChartLoader data={data} />
      </div>

      {/* 범례는 바닥에 붙인다 — 도넛과 붙어 다니면 카드 위쪽만 무거워진다 */}
      <ul className="border-border mx-7 flex flex-col gap-2.5 border-t py-5">
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
