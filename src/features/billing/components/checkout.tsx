"use client";

import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { PLANS } from "../plans";
import {
  BILLING_CYCLE,
  BILLING_CYCLE_LABEL,
  type BillingCycle,
  calculatePrice,
  formatWon,
  SEAT_RANGE,
  YEARLY_DISCOUNT_RATE,
} from "../pricing";
import { PLAN } from "../types";
import { OrderSummary } from "./order-summary";

/** 처음 잡아둘 구성원 수 — 온보딩에서 초대한 수가 오면 그걸 쓴다. */
const DEFAULT_SEATS = 12;

/**
 * 구독 결제.
 *
 * ⚠️ **결제는 미구현이다.** 실연동(Toss) 여부가 미정이고 클라이언트 키도 없다(DECISIONS §미결정).
 * ⚠️ **카드 입력칸을 직접 만들지 않는다.** 우리 폼으로 카드 원번호를 받으면 PCI-DSS 대상이 되고,
 *    Toss 결제위젯은 자체 iframe으로 카드 입력을 그린다 — 직접 만든 input은 연동 때 버려진다.
 *    아래 자리에 위젯을 마운트한다.
 */
export function Checkout() {
  const plan = PLANS.find((item) => item.code === PLAN.TEAM);
  const [cycle, setCycle] = useState<BillingCycle>(BILLING_CYCLE.MONTHLY);
  const [seats, setSeats] = useState(DEFAULT_SEATS);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRecurring, setAgreedRecurring] = useState(false);

  if (!plan) return null;

  const price = calculatePrice(plan, seats, cycle);
  // 결제는 두 동의가 모두 있어야 연다 — 정기 결제라 자동 청구 동의가 따로 필요하다
  const canPay = agreedTerms && agreedRecurring;

  return (
    <>
      <header className="border-border bg-card flex h-[52px] shrink-0 items-center border-b px-[21px]">
        <Link
          href="/owner/billing"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-[3.5px] rounded text-xs leading-[18px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-3.5" />
          구독 관리로
        </Link>
        <h1 className="flex-1 text-center text-[14px] leading-[21px]">결제</h1>
        {/* 좌측 링크와 같은 폭을 오른쪽에도 둬서 제목이 진짜 가운데 오게 한다 */}
        <span className="w-[74px]" aria-hidden />
      </header>

      <div className="flex-1 overflow-y-auto px-[21px] py-[35px]">
        <div className="mx-auto grid w-full max-w-[900px] gap-[21px] lg:grid-cols-[minmax(0,470px)_minmax(0,360px)] lg:justify-center">
          <div className="flex flex-col gap-[21px]">
            <section className="border-border bg-card rounded-[10px] border p-[17.5px]">
              <h2 className="text-[14px] leading-[18px] font-semibold tracking-[-0.28px]">
                플랜 선택
              </h2>

              <div className="flex items-center gap-[10.5px] pt-3.5">
                <span
                  className={cn(
                    "text-xs leading-[18px]",
                    cycle === BILLING_CYCLE.MONTHLY
                      ? "text-foreground"
                      : "text-muted-foreground/70",
                  )}
                >
                  {BILLING_CYCLE_LABEL[BILLING_CYCLE.MONTHLY]}
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={cycle === BILLING_CYCLE.YEARLY}
                  aria-label="연간 결제로 바꾸기"
                  onClick={() =>
                    setCycle((prev) =>
                      prev === BILLING_CYCLE.MONTHLY ? BILLING_CYCLE.YEARLY : BILLING_CYCLE.MONTHLY,
                    )
                  }
                  className={cn(
                    "focus-visible:ring-ring relative h-[22px] w-10 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    cycle === BILLING_CYCLE.YEARLY ? "bg-foreground" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] size-4 rounded-full bg-white shadow transition-[left]",
                      cycle === BILLING_CYCLE.YEARLY ? "left-[21px]" : "left-[3px]",
                    )}
                  />
                </button>

                <span
                  className={cn(
                    "text-xs leading-[18px]",
                    cycle === BILLING_CYCLE.YEARLY ? "text-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {BILLING_CYCLE_LABEL[BILLING_CYCLE.YEARLY]}
                </span>

                <span className="text-muted-foreground/70 ml-auto text-[11px] leading-4 tabular-nums">
                  연간 {Math.round(YEARLY_DISCOUNT_RATE * 100)}% 할인
                </span>
              </div>

              <div className="pt-3.5">
                <div className="flex items-center justify-between pb-[7px]">
                  <label htmlFor="seats" className="text-xs leading-[18px]">
                    구성원 수
                  </label>
                  <output htmlFor="seats" className="text-[14px] leading-[21px] tabular-nums">
                    {seats}명
                  </output>
                </div>

                <input
                  id="seats"
                  type="range"
                  min={SEAT_RANGE.min}
                  max={SEAT_RANGE.max}
                  value={seats}
                  onChange={(event) => setSeats(Number(event.target.value))}
                  className="accent-foreground h-4 w-full"
                />

                <div className="text-muted-foreground/70 flex justify-between pt-[3.5px] text-[10px] leading-[15px] tabular-nums">
                  <span>{SEAT_RANGE.min}명</span>
                  <span>{SEAT_RANGE.max}명</span>
                </div>
              </div>
            </section>

            <section className="border-border bg-card rounded-[10px] border p-[17.5px]">
              <h2 className="text-[14px] leading-[18px] font-semibold tracking-[-0.28px]">
                결제 수단
              </h2>

              {/*
                ⚠️ 카드번호·CVC 입력칸을 직접 만들지 않는다.
                   여기에 Toss 결제위젯을 마운트한다 — 위젯이 카드·계좌이체·간편결제를 통째로 그린다.
                   지금은 클라이언트 키가 없어 자리만 잡아 두고 무엇이 없는지 적는다(§정직성).
              */}
              <div
                id="toss-payment-widget"
                className="border-border text-muted-foreground/70 mt-3.5 flex min-h-[140px] flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 text-center"
              >
                <Info className="size-4" aria-hidden />
                <p className="text-xs leading-[18px] break-keep">
                  Toss Payments 결제위젯이 들어갈 자리예요
                </p>
                <p className="text-[10px] leading-[15px] break-keep">
                  카드·계좌이체·간편결제를 위젯이 직접 그립니다. 아직 연동 전이에요.
                </p>
              </div>

              <p className="text-muted-foreground/70 pt-3.5 text-[10px] leading-[15px] break-keep">
                카드 정보는 Toss Payments가 받고 우리 서버에는 저장되지 않아요.
              </p>
            </section>

            <div className="flex flex-col gap-[7px]">
              <Agreement checked={agreedTerms} onChange={setAgreedTerms}>
                서비스 이용약관 및 개인정보처리방침에 동의합니다
              </Agreement>
              <Agreement checked={agreedRecurring} onChange={setAgreedRecurring}>
                정기 결제 자동 청구에 동의합니다 (매월 또는 매년 자동 갱신)
              </Agreement>
            </div>

            <button
              type="button"
              disabled={!canPay}
              onClick={() =>
                toast.success("결제는 아직 붙지 않았어요", {
                  description: `${plan.name} · ${BILLING_CYCLE_LABEL[cycle]} · ${price.seats}명 — 베타 기간에는 그대로 쓰실 수 있습니다.`,
                })
              }
              className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-ring h-11 w-full rounded-lg text-[14px] leading-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
            >
              결제하기 {formatWon(price.total)} (VAT 포함)
            </button>
          </div>

          <OrderSummary plan={plan} cycle={cycle} price={price} />
        </div>
      </div>
    </>
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
    <label className="flex cursor-pointer items-start gap-[8.75px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-foreground mt-[1.75px] size-3.5 shrink-0"
      />
      <span className="text-muted-foreground text-xs leading-[18px] break-keep">{children}</span>
    </label>
  );
}
