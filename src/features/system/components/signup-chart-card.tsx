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
      {/*
        ⚠️ recharts가 차트 표면에 `tabindex`를 붙여서, **클릭만 해도** 브라우저 기본 테두리가
           차트 전체를 감싼다 — 고른 것도 아닌데 선택된 것처럼 보인다.
        ⚠️ 그렇다고 통째로 끄면 키보드로 다니는 사람이 지금 어디 있는지 알 수 없다(§a11y).
           `:focus-visible`에만 링을 남겨, 마우스로는 안 뜨고 키보드로는 뜬다.
      */}
      <div className="[&_.recharts-surface:focus-visible]:outline-ring px-7 pt-2 pb-7 [&_.recharts-surface]:outline-none [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-2">
        <SignupChartLoader data={data} />
      </div>
    </section>
  );
}
