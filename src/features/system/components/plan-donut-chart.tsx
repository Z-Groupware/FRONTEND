"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { type Plan, PLAN_LABEL } from "@/constants/domain";

import type { PlanDistributionSlice } from "../types";

/** 차트 카테고리 색과 맞춘다(globals.css `--chart-1`·`--chart-2`) — Team이 먼저, Free가 다음. */
const SLICE_COLOR: Record<Plan, string> = {
  TEAM: "var(--chart-1)",
  FREE: "var(--chart-2)",
};

interface PlanDonutChartProps {
  data: PlanDistributionSlice[];
}

/** 플랜 분포 도넛차트. 조각 이름·범례는 카드(`PlanDistributionCard`)가 따로 그린다. */
export function PlanDonutChart({ data }: PlanDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data}
          dataKey="companyCount"
          nameKey="plan"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((slice) => (
            <Cell key={slice.plan} fill={SLICE_COLOR[slice.plan]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          formatter={(value, name) => [`${value}개사`, PLAN_LABEL[name as Plan]]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
