"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DEFAULT_PLAN, planActionLabel, PLANS } from "../plans";
import type { PlanCode } from "../types";
import { PlanCard } from "./plan-card";

/**
 * 요금제 선택.
 *
 * ⚠️ **결제는 미구현이다.** 결제 실연동(Toss) 여부가 아직 정해지지 않았다(DECISIONS §미결정).
 *    주 버튼은 고른 플랜을 알리기만 하고 결제로 넘어가지 않는다 — 되는 척하지 않는다(§정직성).
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
          베타 기간 중에는 모든 플랜을 무료로 사용할 수 있어요
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

      <div className="flex w-full flex-col items-center gap-[10.5px]">
        <button
          type="button"
          onClick={() =>
            toast.success(`${plan.name} 플랜을 골랐어요`, {
              description: "결제는 아직 붙지 않았어요 — 베타 기간에는 그대로 쓰실 수 있습니다.",
            })
          }
          className={cn(
            buttonVariants(),
            "bg-foreground text-background hover:bg-foreground/90 h-[46px] w-full gap-1.5 rounded-lg text-[14px] leading-none",
          )}
        >
          <span className="leading-none">{planActionLabel(plan)}</span>
          <ArrowRight className="size-4" />
        </button>

        <Link
          href="/owner"
          className="text-muted-foreground/70 hover:text-foreground focus-visible:ring-ring rounded px-2 py-1 text-xs leading-[18px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          나중에 결정하기
        </Link>
      </div>

      {/* ⚠️ 결제 화면이 아직 없다. 무엇이 안 되는지 숨기지 않는다(§정직성) */}
      <p className="text-muted-foreground/60 text-center text-[11px] leading-4 break-keep">
        결제는 아직 붙지 않았어요 — 플랜을 고르는 것까지만 됩니다.
      </p>
    </div>
  );
}
