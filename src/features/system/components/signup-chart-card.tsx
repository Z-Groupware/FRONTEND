import type { MonthlySignup } from "../types";
import { SignupChartLoader } from "./signup-chart-loader";

/** "월별 신규 가입 기업" 카드. 차트만 클라이언트고 카드 틀은 서버에서 그린다. */
export function SignupChartCard({ data }: { data: MonthlySignup[] }) {
  return (
    <section className="border-border bg-card flex-1 rounded-2xl border">
      <h2 className="flex items-center gap-2 px-7 pt-6 pb-3 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        월별 신규 가입 기업
      </h2>
      <div className="px-7 pb-6">
        <SignupChartLoader data={data} />
      </div>
    </section>
  );
}
