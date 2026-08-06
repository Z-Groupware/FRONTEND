import type { MonthlyMrr } from "../types";
import { MrrChartLoader } from "./mrr-chart-loader";

/** "월별 MRR 추이" 카드. 차트만 클라이언트고 카드 틀은 서버에서 그린다(`signup-chart-card.tsx`와 같은 구성). */
export function MrrChartCard({ data }: { data: MonthlyMrr[] }) {
  return (
    <section className="border-border bg-card rounded-2xl border">
      <h2 className="flex items-center gap-2 px-7 pt-6 pb-3 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        월별 MRR 추이
      </h2>
      <div className="px-7 pb-6">
        <MrrChartLoader data={data} />
      </div>
    </section>
  );
}
