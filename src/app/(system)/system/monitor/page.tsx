import type { Metadata } from "next";

import { FailedPipelineTableLoader } from "@/features/system/components/failed-pipeline-table-loader";
import { StageTimingCard } from "@/features/system/components/stage-timing-card";
import { StatCard } from "@/features/system/components/stat-card";
import { getMonitoringOverview } from "@/features/system/server";

export const metadata: Metadata = {
  title: "시스템 모니터링",
};

export default async function SystemMonitorPage() {
  const { queue, stageTimings, failedItems } = await getMonitoringOverview();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="대기" value={`${queue.waitingCount}건`} meta="처리 예정" />
          <StatCard
            label="처리 중"
            value={`${queue.processingCount}건`}
            meta={`평균 ${queue.processingAvgSeconds}초`}
            tone="warning"
          />
          <StatCard
            label="실패"
            value={`${queue.failedCount}건`}
            meta="재처리 필요"
            tone="danger"
          />
        </div>

        <StageTimingCard timings={stageTimings} />

        <FailedPipelineTableLoader items={failedItems} />
      </div>
    </main>
  );
}
