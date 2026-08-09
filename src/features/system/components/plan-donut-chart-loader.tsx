"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { PlanDistributionSlice } from "../types";

/** `signup-chart-loader.tsx`와 같은 이유로 분리한 로더 — `recharts` 코드는 여기서만 불러온다. */
const PlanDonutChart = dynamic(() => import("./plan-donut-chart").then((m) => m.PlanDonutChart), {
  ssr: false,
  /* ⚠️ 스켈레톤 지름을 도넛 바깥지름(92 * 2)과 맞춘다 — 다르면 차트가 뜨는 순간 카드가 튄다 */
  loading: () => <Skeleton className="mx-auto size-[184px] rounded-full" />,
});

export function PlanDonutChartLoader({ data }: { data: PlanDistributionSlice[] }) {
  return <PlanDonutChart data={data} />;
}
