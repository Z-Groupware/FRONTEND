"use client";

import { CheckMark } from "@/components/common/check-mark";
import { cn } from "@/lib/utils";

import type { Plan } from "../types";

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * 요금제 카드 한 장.
 *
 * ⚠️ 라디오 버튼이다 — `role="radio"`로 알린다. 카드 전체가 눌리므로 `button`을 쓴다.
 *    (클릭되는 건 `div`가 아니라 `button`이어야 키보드로도 닿는다 — CLAUDE.md §a11y)
 */
export function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={cn(
        "bg-card focus-visible:ring-ring relative flex flex-1 flex-col gap-2.5 rounded-[10px] border-2 p-[17.5px] text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        // 고른 카드는 테두리가 진해진다. 색이 아니라 **명도**로 구분한다(§디자인 토큰)
        isSelected ? "border-foreground" : "border-border hover:border-foreground/30",
      )}
    >
      {plan.isRecommended && (
        <span className="bg-foreground text-background absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-[8.75px] text-[10px] leading-5 whitespace-nowrap">
          가장 많이 선택해요
        </span>
      )}

      <span className="flex flex-col">
        <span className="text-[14px] leading-[21px]">{plan.name}</span>
        <span className="text-[22px] leading-[33px] tabular-nums">{plan.price}</span>
        <span className="text-muted-foreground/70 text-[11px] leading-4">{plan.unit}</span>
      </span>

      <span className="flex flex-col gap-[5.25px]">
        {plan.features.map((feature) => (
          <span key={feature} className="flex items-center gap-[5.25px]">
            {/* 시안은 초록 체크지만 먹색으로 간다 — 색으로 알리는 건 에러뿐 */}
            <CheckMark size={11} strokeWidth={3} />
            <span className="text-muted-foreground text-xs leading-[18px]">{feature}</span>
          </span>
        ))}
      </span>
    </button>
  );
}
