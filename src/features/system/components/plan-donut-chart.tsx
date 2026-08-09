"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { type Plan, PLAN_LABEL } from "@/constants/domain";

import type { PlanDistributionSlice } from "../types";

/**
 * 조각은 색(hue)이 아니라 명도로 가른다(DESIGN §5·§10 — 색으로 알리는 건 에러뿐이다).
 * `storage-summary.tsx`의 두 조각(`bg-foreground`/`bg-foreground/35`)과 같은 규칙.
 */
const SLICE_OPACITY: Record<Plan, number> = {
  TEAM: 1,
  FREE: 0.35,
};

interface PlanDonutChartProps {
  data: PlanDistributionSlice[];
}

/** 플랜 분포 도넛차트. 조각 이름·범례는 카드(`PlanDistributionCard`)가 따로 그린다. */
export function PlanDonutChart({ data }: PlanDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={168}>
      <PieChart>
        <Pie
          data={data}
          dataKey="companyCount"
          nameKey="plan"
          innerRadius={52}
          outerRadius={78}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((slice) => (
            <Cell
              key={slice.plan}
              fill="var(--foreground)"
              fillOpacity={SLICE_OPACITY[slice.plan]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 11,
          }}
          itemStyle={{ color: "var(--popover-foreground)" }}
          formatter={(value, name) => [`${value}개사`, PLAN_LABEL[name as Plan]]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
