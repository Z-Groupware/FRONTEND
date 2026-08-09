"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MonthlySignup } from "../types";

interface SignupChartProps {
  data: MonthlySignup[];
}

/**
 * 월별 신규 가입 기업 막대그래프. 단일 계열이라 범례는 두지 않는다.
 *
 * ⚠️ **막대는 색이 아니라 명도다**(DESIGN §10 "조각은 색이 아니라 명도로 나눈다").
 *    한때 `--chart-1`(주황)이었는데 두 가지가 어긋났다 — 바로 옆 도넛은 이미 명도로 갈라 둬서
 *    같은 화면에서 규칙이 둘이었고, **주황은 이미 Owner라는 뜻**이라(§5) 데이터에 쓰면 뜻이
 *    두 개가 된다. 계열이 하나뿐이라 색으로 가를 것도 없다.
 * ⚠️ hover 커서를 **아주 옅게** 둔다. `--muted`로 채우면 막대 뒤에 큰 회색 덩어리가 생겨
 *    정작 봐야 할 막대보다 눈에 먼저 들어온다.
 */
export function SignupChart({ data }: SignupChartProps) {
  return (
    <ResponsiveContainer width="100%" height={224}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          /* ⚠️ 폭은 recharts 기본값을 그대로 둔다 — `margin.left: -16`이 이미 그 폭을 전제로
                당겨 놓은 값이라, 여기서 좁히면 두 자리 눈금(`12`)이 잘린다. */
          allowDecimals={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "var(--foreground)", fillOpacity: 0.04 }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 11,
          }}
          /* ⚠️ 항목 이름·값도 글자색을 고정한다 — 안 주면 recharts가 **계열 색**을 그대로 써서
                툴팁 글자만 다른 색으로 뜬다(주황일 때 실제로 그랬다). */
          itemStyle={{ color: "var(--popover-foreground)" }}
          labelStyle={{ color: "var(--muted-foreground)", marginBottom: 2 }}
          formatter={(value) => [`${value}개사`, "신규 가입"]}
        />
        <Bar dataKey="count" fill="var(--foreground)" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
