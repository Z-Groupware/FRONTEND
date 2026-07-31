import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { ZLogo } from "@/components/icons/z-logo";
import { cn } from "@/lib/utils";

import { ONBOARDING_STEP_LABEL, ONBOARDING_TOTAL_STEPS, type OnboardingStep } from "../types";

const STEPS = Object.keys(ONBOARDING_STEP_LABEL).map(Number) as OnboardingStep[];

interface OnboardingShellProps {
  step: OnboardingStep;
  children: ReactNode;
}

/** 온보딩 3단계가 공유하는 헤더·스텝퍼 프레임. */
export function OnboardingShell({ step, children }: OnboardingShellProps) {
  return (
    // 배경 점 그리드 — 토큰(--border)을 그대로 써서 다크에서도 따라온다
    <div className="bg-background flex min-h-dvh flex-col bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px]">
      <header className="border-border bg-background/90 flex h-[52px] shrink-0 items-center gap-[7px] border-b px-[21px] backdrop-blur">
        <ZLogo className="text-foreground size-[18px]" title="Z" />
        <span className="text-muted-foreground/70 ml-auto text-xs leading-[18px] tabular-nums">
          단계 <span className="text-foreground">{step}</span> / {ONBOARDING_TOTAL_STEPS}
        </span>
      </header>

      {/* 세로 가운데 정렬 — 콘텐츠가 화면 위쪽에만 몰리지 않게 한다 */}
      <main className="flex flex-1 flex-col justify-center px-[21px] py-10">
        <div className="mx-auto w-full max-w-[1160px]">{children}</div>
      </main>

      <footer className="border-border bg-background/90 flex h-16 shrink-0 items-center justify-center border-t px-[21px]">
        <ol className="flex flex-wrap items-center">
          {STEPS.map((value) => (
            <li key={value} className="flex items-center">
              <StepBadge
                label={ONBOARDING_STEP_LABEL[value]}
                value={String(value)}
                isActive={value === step}
              />
              <span className="bg-border mx-[14px] h-px w-[35px]" aria-hidden />
            </li>
          ))}
          <li className="pl-[14px]">
            <StepBadge label="완료" value={<Check className="size-3" />} isActive={false} isDone />
          </li>
        </ol>
      </footer>
    </div>
  );
}

function StepBadge({
  label,
  value,
  isActive,
  isDone = false,
}: {
  label: string;
  value: ReactNode;
  isActive: boolean;
  isDone?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-[7px] text-xs leading-[18px]",
        isActive ? "text-foreground" : "text-muted-foreground/70",
      )}
      aria-current={isActive ? "step" : undefined}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full text-[11px] leading-4 tabular-nums",
          isDone ? "size-7" : "size-[21px]",
          isActive ? "bg-foreground text-background" : "bg-secondary",
        )}
      >
        {value}
      </span>
      {label}
    </span>
  );
}
