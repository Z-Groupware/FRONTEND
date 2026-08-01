import type { Metadata } from "next";

import { PlanSelect } from "@/features/billing/components/plan-select";
import { OnboardingShell } from "@/features/onboarding/components/onboarding-shell";
import { ONBOARDING_STEP } from "@/features/onboarding/types";

export const metadata: Metadata = {
  title: "플랜 선택",
};

/**
 * 요금제 선택 — 온보딩 완료 화면에서 넘어온다.
 *
 * 온보딩과 **같은 셸**을 쓴다. 흐름이 이어지는 화면인데 프레임이 달라지면 딴 데로 온 것처럼 보인다.
 */
export default function PricingPage() {
  return (
    <OnboardingShell step={ONBOARDING_STEP.INVITE} isDone>
      <PlanSelect />
    </OnboardingShell>
  );
}
