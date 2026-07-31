"use client";

import { Check } from "lucide-react";
import { type ReactNode, useState } from "react";

import { ZLogo } from "@/components/icons/z-logo";
import { cn } from "@/lib/utils";

import { ONBOARDING_STEP_LABEL, ONBOARDING_TOTAL_STEPS, type OnboardingStep } from "../types";
import { OnboardingGuide } from "./onboarding-guide";
import { StepCircle } from "./step-circle";

const STEPS = Object.keys(ONBOARDING_STEP_LABEL).map(Number) as OnboardingStep[];

interface OnboardingShellProps {
  step: OnboardingStep;
  children: ReactNode;
}

/** 온보딩 3단계가 공유하는 헤더·스텝퍼 프레임. */
export function OnboardingShell({ step, children }: OnboardingShellProps) {
  // 도움말은 화면 위에 떠 있는 패널이다 — 본문 레이아웃은 건드리지 않는다
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    // 배경 점 그리드 — 토큰(--border)을 그대로 써서 다크에서도 따라온다.
    // ⚠️ 화면 높이에 딱 맞춰 고정한다(h-dvh + overflow-hidden) — 페이지가 스크롤되거나
    //    끝에서 튕기지 않는다. 움직임은 카드 안쪽 목록에서만 일어난다.
    <div className="bg-background flex h-dvh flex-col overflow-hidden overscroll-none bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px]">
      <header className="border-border bg-background/90 flex h-[52px] shrink-0 items-center gap-[7px] border-b px-[21px] backdrop-blur">
        <ZLogo className="text-foreground size-[18px]" title="Z" />
        <span className="text-muted-foreground/70 ml-auto text-xs leading-[18px] tabular-nums">
          단계 <span className="text-foreground">{step}</span> / {ONBOARDING_TOTAL_STEPS}
        </span>
      </header>

      {/* 세로 가운데 정렬 — 콘텐츠가 화면 위쪽에만 몰리지 않게 한다 */}
      {/* 세로 가운데 정렬 — 콘텐츠가 화면 위쪽에만 몰리지 않게 한다 */}
      <main className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-[21px] py-10">
        <div className="mx-auto w-full max-w-[1160px]">{children}</div>
      </main>

      <footer className="border-border bg-background/90 flex h-16 shrink-0 items-center justify-center border-t px-[21px]">
        <ol className="flex flex-wrap items-center">
          {STEPS.map((value) => (
            <li key={value} className="flex items-center">
              <StepperItem label={ONBOARDING_STEP_LABEL[value]} step={value} current={step} />
              {/* 지나온 구간은 선도 진하게 이어진다 */}
              <span
                className={cn(
                  "mx-[14px] h-px w-[35px]",
                  value < step ? "bg-foreground" : "bg-border",
                )}
                aria-hidden
              />
            </li>
          ))}
          <li className="flex items-center gap-[7px] pl-[14px]">
            <StepCircle tone="idle" size={28}>
              <Check className="size-3" />
            </StepCircle>
            <span className="text-muted-foreground/70 text-xs leading-[18px]">완료</span>
          </li>
        </ol>
      </footer>
      <OnboardingGuide
        step={step}
        isOpen={isGuideOpen}
        onToggle={() => setIsGuideOpen((prev) => !prev)}
      />
    </div>
  );
}

function StepperItem({
  label,
  step,
  current,
}: {
  label: string;
  step: OnboardingStep;
  current: OnboardingStep;
}) {
  const isDone = step < current;
  const isCurrent = step === current;

  return (
    <span
      className={cn(
        "flex items-center gap-[7px] text-xs leading-[18px]",
        isDone && "text-foreground",
        isCurrent && "text-foreground",
        !isDone && !isCurrent && "text-muted-foreground/70",
      )}
      aria-current={isCurrent ? "step" : undefined}
    >
      <StepCircle tone={isDone ? "done" : isCurrent ? "current" : "idle"} size={21}>
        {isDone ? (
          <>
            <Check className="size-[11px]" />
            <span className="sr-only">완료됨</span>
          </>
        ) : (
          <span className="text-[11px]">{step}</span>
        )}
      </StepCircle>
      {label}
    </span>
  );
}
