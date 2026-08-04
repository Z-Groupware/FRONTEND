"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { PlanDistributionSlice } from "../types";

/** `signup-chart-loader.tsx`와 같은 이유로 분리한 로더 — `recharts` 코드는 여기서만 불러온다. */
const PlanDonutChart = dynamic(() => import("./plan-donut-chart").then((m) => m.PlanDonutChart), {
  ssr: false,
  loading: () => <Skeleton className="mx-auto size-[116px] rounded-full" />,
});

export function PlanDonutChartLoader({ data }: { data: PlanDistributionSlice[] }) {
  return <PlanDonutChart data={data} />;
}
