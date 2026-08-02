"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  BILLING_CYCLE,
  BILLING_CYCLE_LABEL,
  type BillingCycle,
  SEAT_RANGE,
  YEARLY_DISCOUNT_RATE,
} from "../pricing";
import type { Plan } from "../types";

interface PlanConfigProps {
  plan: Plan;
  cycle: BillingCycle;
  onCycleChange: (next: BillingCycle) => void;
  seats: number;
  onSeatsChange: (next: number) => void;
}

/** 무엇을 얼마치 살지 고르는 칸 — 플랜 요약 · 결제 주기 · 구성원 수. */
export function PlanConfig({ plan, cycle, onCycleChange, seats, onSeatsChange }: PlanConfigProps) {
  return (
    <section className="border-border bg-card rounded-xl border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] leading-6 font-semibold tracking-[-0.3px]">
            {plan.name} 플랜
          </h2>
          <p className="text-muted-foreground pt-1 text-[13px] leading-5">
            {plan.price} {plan.unit}
          </p>
        </div>
        <span className="bg-foreground text-background shrink-0 rounded-full px-2.5 py-1 text-[11px] leading-4">
          가장 많이 선택해요
        </span>
      </div>

      <ul className="grid gap-2 pt-5 sm:grid-cols-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-[13px] leading-5">
            <Check className="text-muted-foreground size-4 shrink-0" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      <div className="border-border mt-6 border-t pt-6">
        <h3 className="text-[13px] leading-5 font-semibold">결제 주기</h3>
      </div>

      <div className="flex items-center gap-3 pt-3">
        <span
          className={cn(
            "text-[13px] leading-5",
            cycle === BILLING_CYCLE.MONTHLY ? "text-foreground" : "text-muted-foreground/70",
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
            onCycleChange(
              cycle === BILLING_CYCLE.MONTHLY ? BILLING_CYCLE.YEARLY : BILLING_CYCLE.MONTHLY,
            )
          }
          className={cn(
            "focus-visible:ring-ring relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
            cycle === BILLING_CYCLE.YEARLY ? "bg-foreground" : "bg-border",
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-[left]",
              cycle === BILLING_CYCLE.YEARLY ? "left-[23px]" : "left-[3px]",
            )}
          />
        </button>

        <span
          className={cn(
            "text-[13px] leading-5",
            cycle === BILLING_CYCLE.YEARLY ? "text-foreground" : "text-muted-foreground/70",
          )}
        >
          {BILLING_CYCLE_LABEL[BILLING_CYCLE.YEARLY]}
        </span>

        <span className="bg-secondary text-muted-foreground ml-auto rounded-full px-2.5 py-1 text-[11px] leading-4 tabular-nums">
          연간 {Math.round(YEARLY_DISCOUNT_RATE * 100)}% 할인
        </span>
      </div>

      <div className="border-border mt-6 border-t pt-6">
        <div className="flex items-end justify-between pb-3">
          <label htmlFor="seats" className="text-[13px] leading-5 font-semibold">
            구성원 수
          </label>
          <output htmlFor="seats" className="text-[18px] leading-6 font-semibold tabular-nums">
            {seats}명
          </output>
        </div>

        <input
          id="seats"
          type="range"
          min={SEAT_RANGE.min}
          max={SEAT_RANGE.max}
          value={seats}
          onChange={(event) => onSeatsChange(Number(event.target.value))}
          className="accent-foreground h-5 w-full"
        />

        <div className="text-muted-foreground/70 flex justify-between pt-1 text-[11px] leading-4 tabular-nums">
          <span>{SEAT_RANGE.min}명</span>
          <span>{SEAT_RANGE.max}명</span>
        </div>
      </div>
    </section>
  );
}
