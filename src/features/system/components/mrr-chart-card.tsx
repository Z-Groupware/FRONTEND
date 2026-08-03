import type { MonthlyMrr } from "../types";
import { MrrChartLoader } from "./mrr-chart-loader";

/** "월별 MRR 추이" 카드. 차트만 클라이언트고 카드 틀은 서버에서 그린다(`signup-chart-card.tsx`와 같은 구성). */
export function MrrChartCard({ data }: { data: MonthlyMrr[] }) {
  return (
    <section className="border-border bg-card rounded-xl border p-6">
      <h2 className="text-foreground text-base font-semibold">월별 MRR 추이</h2>
      <div className="mt-4">
        <MrrChartLoader data={data} />
      </div>
    </section>
  );
}
