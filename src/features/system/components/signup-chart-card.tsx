import type { MonthlySignup } from "../types";
import { SignupChartLoader } from "./signup-chart-loader";

/** "월별 신규 가입 기업" 카드. 차트만 클라이언트고 카드 틀은 서버에서 그린다. */
export function SignupChartCard({ data }: { data: MonthlySignup[] }) {
  return (
    <section className="border-border bg-card flex-1 rounded-xl border p-6">
      <h2 className="text-foreground text-base font-semibold">월별 신규 가입 기업</h2>
      <div className="mt-4">
        <SignupChartLoader data={data} />
      </div>
    </section>
  );
}
