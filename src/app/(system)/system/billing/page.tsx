import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MrrChartCard } from "@/features/system/components/mrr-chart-card";
import { SubscriptionTable } from "@/features/system/components/subscription-table";
import { SummaryCard } from "@/features/system/components/summary-card";
import { formatCompactKrw } from "@/features/system/format";
import { getBillingOverview } from "@/features/system/server";

export const metadata: Metadata = {
  title: "구독·매출 관리",
};

export default async function SystemBillingPage() {
  const { summary, monthlyMrr, subscriptions } = await getBillingOverview();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7">
        <SummaryCard
          items={[
            {
              label: "이번 달 MRR",
              value: formatCompactKrw(summary.mrr),
              meta: `전월 대비 +${summary.mrrDeltaPercent}%`,
            },
            {
              label: "결제 완료",
              value: `${summary.paidCount}`,
              unit: "건",
              meta: formatCompactKrw(summary.paidAmount),
            },
            { label: "미납", value: `${summary.unpaidCount}`, unit: "건", meta: "안내 발송 필요" },
            {
              label: "해지",
              value: `${summary.canceledCountThisMonth}`,
              unit: "건",
              meta: "이번 달",
            },
          ]}
        />

        <MrrChartCard data={monthlyMrr} />

        <div className="flex flex-col gap-2">
          <SubscriptionTable subscriptions={subscriptions} />

          <Link
            href="/system/companies"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 self-end rounded text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            전체 기업 목록 보기
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
