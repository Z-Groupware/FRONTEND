"use client";

import { BadgePercent, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { PLANS } from "../plans";
import {
  BILLING_CYCLE,
  BILLING_CYCLE_LABEL,
  type BillingCycle,
  calculatePrice,
  formatWon,
  YEARLY_DISCOUNT_RATE,
} from "../pricing";
import { PLAN } from "../types";
import { OrderSummary } from "./order-summary";
import { PaymentDoneDialog } from "./payment-done-dialog";
import { PlanConfig } from "./plan-config";

/** 처음 잡아둘 구성원 수 — 온보딩에서 초대한 수가 오면 그걸 쓴다. */
const DEFAULT_SEATS = 12;

/**
 * 구독 결제.
 *
 * ⚠️ **결제는 미구현이다.** 실연동(Toss) 여부가 미정이고 클라이언트 키도 없다(DECISIONS §미결정).
 *    지금은 [결제하기]를 누르면 완료 창만 뜬다 — 연동되면 이 자리에서 Toss 결제창을 띄우고
 *    **성공 응답을 받은 뒤에** 그 창을 연다.
 * ⚠️ **카드 입력칸을 직접 만들지 않는다.** 우리 폼으로 카드 원번호를 받으면 PCI-DSS 대상이 된다.
 *    카드·계좌이체·간편결제 선택은 Toss 결제창이 통째로 그리므로 이 화면에 결제 수단 칸을 두지 않는다.
 */
export function Checkout() {
  const plan = PLANS.find((item) => item.code === PLAN.TEAM);
  const [cycle, setCycle] = useState<BillingCycle>(BILLING_CYCLE.MONTHLY);
  const [seats, setSeats] = useState(DEFAULT_SEATS);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRecurring, setAgreedRecurring] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!plan) return null;

  const price = calculatePrice(plan, seats, cycle);
  // 결제는 두 동의가 모두 있어야 연다 — 정기 결제라 자동 청구 동의가 따로 필요하다
  const canPay = agreedTerms && agreedRecurring;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-8 lg:flex-row lg:items-start">
        {/* 왼쪽 — 무엇을 얼마에 사는지 고르고 확인한다 */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <PlanConfig
            plan={plan}
            cycle={cycle}
            onCycleChange={setCycle}
            seats={seats}
            onSeatsChange={setSeats}
          />

          <OrderSummary plan={plan} cycle={cycle} price={price} />
        </div>

        {/* 오른쪽 — 확인하고 결제한다. 스크롤해도 따라온다 */}
        {/*
          스티키는 **감싼 칸 안에서** 건다 — flex 자식에 바로 걸면 처음부터 top만큼 내려가
          왼쪽 카드와 윗줄이 어긋난다. 감싸두면 시작은 같은 줄, 스크롤하면 따라붙는다.
        */}
        <div className="w-full shrink-0 lg:w-[380px]">
          <aside className="border-border bg-card flex flex-col rounded-2xl border p-7 shadow-sm lg:sticky lg:top-0">
            {/* 무엇을 사는지 — 제목을 또 쓰지 않는다(화면 제목이 이미 "결제"다) */}
            <div className="flex items-center gap-2">
              <span className="bg-secondary text-foreground border-border rounded-md border px-2 py-1 text-[11px] leading-4 font-semibold">
                {plan.name}
              </span>
              <span className="text-muted-foreground text-[13px] leading-5 tabular-nums">
                {BILLING_CYCLE_LABEL[cycle]} · {price.seats}명
              </span>
            </div>

            {/* 라벨을 위로 빼고 금액을 왼쪽에 크게 — 숫자가 카드의 주인공이 된다 */}
            <p className="text-muted-foreground pt-6 text-[13px] leading-5">
              {cycle === BILLING_CYCLE.YEARLY ? "매년" : "매월"} 청구
            </p>
            <p className="pt-1.5 text-[34px] leading-none font-bold tracking-[-1px] tabular-nums">
              {formatWon(price.total)}
            </p>
            <p className="text-muted-foreground/70 flex items-center gap-1.5 pt-3 text-[11px] leading-4">
              <RefreshCw className="size-3.5 shrink-0" aria-hidden />
              {/* 한글 글자가 상자 안에서 위쪽에 앉아 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
              <span className="translate-y-px">VAT 포함 · 언제든 해지할 수 있어요</span>
            </p>

            {/* 얼마나 아꼈는지는 금액으로 알린다 — %만 보면 감이 안 온다 */}
            {price.yearlySaving > 0 && (
              <p className="border-border bg-secondary mt-5 flex items-center gap-2 rounded-xl border px-3.5 py-3 text-[12px] leading-[18px]">
                <BadgePercent className="size-4 shrink-0" aria-hidden />
                <span>
                  <span className="font-semibold tabular-nums">
                    {Math.round(YEARLY_DISCOUNT_RATE * 100)}% 할인
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {" "}
                    · {formatWon(price.yearlySaving)} 아꼈어요
                  </span>
                </span>
              </p>
            )}

            {/* 동의는 한 덩어리로 묶는다 — 낱개로 흩어 두면 버튼 앞이 산만하다 */}
            <div className="bg-secondary/50 mt-6 flex flex-col gap-3 rounded-xl p-4">
              <Agreement checked={agreedTerms} onChange={setAgreedTerms}>
                이용약관 · 개인정보처리방침에 동의합니다
              </Agreement>
              <Agreement checked={agreedRecurring} onChange={setAgreedRecurring}>
                정기 결제 자동 청구에 동의합니다
              </Agreement>
            </div>

            <button
              type="button"
              disabled={!canPay}
              onClick={() => setIsDone(true)}
              className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-ring disabled:bg-secondary disabled:text-muted-foreground/60 mt-4 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-xl text-[18px] leading-none font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none"
            >
              <span className="tabular-nums">{formatWon(price.total)}</span>
              결제하기
            </button>

            <p className="text-muted-foreground/70 flex items-center justify-center gap-1.5 pt-4 text-[11px] leading-4">
              <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
              {/* 한글 글자가 상자 안에서 위쪽에 앉아 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
              <span className="translate-y-px">Toss Payments로 안전하게 결제돼요</span>
            </p>
          </aside>
        </div>
      </div>

      <PaymentDoneDialog
        isOpen={isDone}
        onOpenChange={setIsDone}
        plan={plan}
        cycle={cycle}
        price={price}
      />
    </div>
  );
}

function Agreement({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-foreground mt-[3px] size-[15px] shrink-0"
      />
      <span className="text-muted-foreground text-[12px] leading-[18px] break-keep">
        {children}
      </span>
    </label>
  );
}
