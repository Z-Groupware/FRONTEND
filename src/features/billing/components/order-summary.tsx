import { CreditCard } from "lucide-react";

import { BILLING_CYCLE_LABEL, type BillingCycle, formatWon, type PriceBreakdown } from "../pricing";
import type { Plan } from "../types";

interface OrderSummaryProps {
  plan: Plan;
  cycle: BillingCycle;
  price: PriceBreakdown;
}

/** 주문 요약 — 무엇을 얼마에 사는지 한눈에. 결제 버튼 옆에 붙어 있어야 한다. */
export function OrderSummary({ plan, cycle, price }: OrderSummaryProps) {
  return (
    <section className="border-border bg-card rounded-[10px] border p-[17.5px]">
      <h2 className="text-[14px] leading-[18px] font-semibold tracking-[-0.28px]">주문 요약</h2>

      <dl className="flex flex-col gap-[8.75px] pt-3.5">
        <Row label="플랜" value={`${plan.name} (${BILLING_CYCLE_LABEL[cycle]})`} />
        <Row label="구성원" value={`${price.seats}명 × ${formatWon(price.unitPrice)}`} />
        <Row label="소계" value={formatWon(price.subtotal)} />
        <Row label="VAT (10%)" value={formatWon(price.vat)} isMuted />

        <div className="border-border flex items-center justify-between border-t pt-[8.75px]">
          <dt className="text-[13px] leading-5">합계</dt>
          <dd className="text-[13px] leading-5 font-semibold tabular-nums">
            {formatWon(price.total)}
          </dd>
        </div>
      </dl>

      <p className="border-border bg-secondary text-muted-foreground mt-3.5 rounded-md border px-[10.5px] py-[8.75px] text-[11px] leading-4 break-keep">
        첫 결제 후 매월/매년 자동 갱신됩니다. 언제든지 해지할 수 있어요.
      </p>

      <p className="text-muted-foreground/70 flex items-center gap-[5.25px] pt-[10.5px] text-[10px] leading-[15px]">
        <CreditCard className="size-[11px] shrink-0" aria-hidden />
        Toss Payments로 안전하게 처리됩니다
      </p>
    </section>
  );
}

function Row({ label, value, isMuted }: { label: string; value: string; isMuted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt
        className={
          isMuted
            ? "text-muted-foreground/70 text-[11px] leading-4"
            : "text-muted-foreground text-[13px] leading-5"
        }
      >
        {label}
      </dt>
      <dd
        className={
          isMuted
            ? "text-muted-foreground/70 text-[11px] leading-4 tabular-nums"
            : "text-[13px] leading-5 tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
