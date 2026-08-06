import type { Metadata } from "next";

import { PlanDistributionCard } from "@/features/system/components/plan-distribution-card";
import { RecentCompaniesTable } from "@/features/system/components/recent-companies-table";
import { SignupChartCard } from "@/features/system/components/signup-chart-card";
import { SummaryCard } from "@/features/system/components/summary-card";
import { formatCompactKrw } from "@/features/system/format";
import { getDashboardOverview } from "@/features/system/server";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function SystemDashboardPage() {
  const { summary, monthlySignups, planDistribution, recentCompanies } =
    await getDashboardOverview();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7">
        <SummaryCard
          items={[
            {
              label: "가입 기업 수",
              value: `${summary.companyCount}`,
              meta: `이번 달 +${summary.companyCountDeltaThisMonth}`,
            },
            {
              label: "활성 사용자",
              value: `${summary.activeUserCount}`,
              meta: `전월 대비 +${summary.activeUserDeltaPercent}%`,
            },
            {
              label: "MRR",
              value: formatCompactKrw(summary.mrr),
              meta: `Team ${summary.teamPlanCompanyCount}개사`,
            },
            {
              label: "승인 대기",
              value: `${summary.pendingApprovalCount}건`,
              meta: "기업 가입 신청",
            },
          ]}
        />

        <div className="flex flex-col gap-3 lg:flex-row">
          <SignupChartCard data={monthlySignups} />
          <PlanDistributionCard data={planDistribution} />
        </div>

        <RecentCompaniesTable companies={recentCompanies} />
      </div>
    </main>
  );
}
