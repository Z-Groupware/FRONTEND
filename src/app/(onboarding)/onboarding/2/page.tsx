import type { Metadata } from "next";

import { OnboardingShell } from "@/features/onboarding/components/onboarding-shell";
import { PositionSetup } from "@/features/onboarding/components/position-setup";
import { getPositions } from "@/features/onboarding/server";
import { ONBOARDING_STEP } from "@/features/onboarding/types";

export const metadata: Metadata = {
  title: "직급 체계 설정",
};

export default async function OnboardingPositionPage() {
  const positions = await getPositions();

  return (
    <OnboardingShell step={ONBOARDING_STEP.POSITION}>
      <PositionSetup initialPositions={positions} />
    </OnboardingShell>
  );
}
