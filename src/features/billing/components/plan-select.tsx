"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DEFAULT_PLAN, planActionLabel, PLANS } from "../plans";
import { PLAN, type PlanCode } from "../types";
import { PlanCard } from "./plan-card";

/**
 * 요금제 선택 — 고를 수 있는 건 **Free / Team 둘뿐**이다.
 *
 * ⚠️ **실제 청구는 미구현이다.** 결제 실연동(Toss) 여부가 정해지지 않았다(DECISIONS §미결정).
 *    화면은 결제까지 이어지되, 청구가 나가지 않는다는 걸 화면에 적는다(§정직성).
 */
export function PlanSelect() {
  const [selected, setSelected] = useState<PlanCode>(DEFAULT_PLAN);
  const plan = PLANS.find((item) => item.code === selected) ?? PLANS[0];

  if (!plan) return null;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-[21px] py-7">
      <div className="flex flex-col items-center gap-[7px] text-center">
        <h1 className="text-2xl leading-[30px] font-semibold tracking-[-0.48px]">
          플랜을 선택하세요
        </h1>
        <p className="text-muted-foreground text-[13px] leading-5 break-keep">
          나중에 언제든지 바꿀 수 있어요
        </p>
      </div>

      {/* 배지가 카드 위로 걸치므로 위쪽 여백을 조금 준다 */}
      <div role="radiogroup" aria-label="요금제" className="flex w-full gap-[10.5px] pt-2.5">
        {PLANS.map((item) => (
          <PlanCard
            key={item.code}
            plan={item}
            isSelected={item.code === selected}
            onSelect={() => setSelected(item.code)}
          />
        ))}
      </div>

      {/*
        고를 수 있는 건 Free / Team 둘뿐이고 둘 다 갈 곳이 있다 —
        Free는 바로 대시보드로, Team은 결제로 간다. "나중에 결정하기"는 두지 않는다.
      */}
      <Link
        href={plan.code === PLAN.FREE ? "/owner" : "/owner/billing/checkout"}
        className={cn(
          buttonVariants(),
          "bg-foreground text-background hover:bg-foreground/90 h-[46px] w-full gap-1.5 rounded-lg text-[14px] leading-none",
        )}
      >
        <span className="leading-none">{planActionLabel(plan)}</span>
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
