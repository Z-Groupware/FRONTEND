import { OnboardingShell } from "@/features/onboarding/components/onboarding-shell";
import { ONBOARDING_STEP } from "@/features/onboarding/types";

/** 요금제를 불러오는 동안 — 자리를 미리 잡아 화면이 들썩이지 않게 한다. */
export default function Loading() {
  return (
    <OnboardingShell step={ONBOARDING_STEP.INVITE} isDone>
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-[21px] py-7">
        <div className="bg-muted h-[57px] w-[280px] animate-pulse rounded-md" />
        <div className="flex w-full gap-[10.5px] pt-2.5">
          <div className="border-border bg-card h-[184px] flex-1 animate-pulse rounded-[10px] border-2" />
          <div className="border-border bg-card h-[184px] flex-1 animate-pulse rounded-[10px] border-2" />
        </div>
        <div className="bg-muted h-[46px] w-full animate-pulse rounded-lg" />
      </div>
    </OnboardingShell>
  );
}
