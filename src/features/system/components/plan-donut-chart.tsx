"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { type Plan, PLAN_LABEL } from "@/constants/domain";

import type { PlanDistributionSlice } from "../types";

/**
 * 조각 색 — **유료(Team)만 액센트**, 무료는 무채색이다.
 *
 * ⚠️ 색이 뜻을 갖는다: 돈을 내는 쪽이 이 화면에서 볼 값이고, 무료는 그 배경이다.
 *    두 조각을 다 칠하면 무엇이 중요한지가 사라지고 그냥 알록달록해진다.
 * ⚠️ 무채색 조각은 **35%**다. 25%·30%는 다크 카드(#242120) 위에서 2.2~2.6:1이라
 *    그래픽 기준 3:1에 못 미친다 — 35%가 3.11:1로 겨우 넘는다.
 */
const SLICE_FILL: Record<Plan, { fill: string; opacity: number }> = {
  TEAM: { fill: "var(--chart-1)", opacity: 1 },
  FREE: { fill: "var(--foreground)", opacity: 0.35 },
};

interface PlanDonutChartProps {
  data: PlanDistributionSlice[];
}

/** 플랜 분포 도넛차트. 조각 이름·범례는 카드(`PlanDistributionCard`)가 따로 그린다. */
export function PlanDonutChart({ data }: PlanDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={196}>
      <PieChart>
        <Pie
          data={data}
          dataKey="companyCount"
          nameKey="plan"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((slice) => (
            <Cell
              key={slice.plan}
              fill={SLICE_FILL[slice.plan].fill}
              fillOpacity={SLICE_FILL[slice.plan].opacity}
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
