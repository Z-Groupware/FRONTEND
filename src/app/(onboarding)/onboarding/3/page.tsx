import type { Metadata } from "next";

import { InviteSetup } from "@/features/onboarding/components/invite-setup";
import { OnboardingShell } from "@/features/onboarding/components/onboarding-shell";
import { getDepartments, getPositions } from "@/features/onboarding/server";
import { ONBOARDING_STEP } from "@/features/onboarding/types";

export const metadata: Metadata = {
  title: "사원 초대",
};

export default async function OnboardingInvitePage() {
  const [departments, positions] = await Promise.all([getDepartments(), getPositions()]);

  return (
    <OnboardingShell step={ONBOARDING_STEP.INVITE}>
      {/* 말단 부서만 고를 수 있게 거르는 일은 화면에서 한다 — 1·2단계 편집분과 같은 규칙을 써야 해서다 */}
      <InviteSetup departments={departments} positions={positions} />
    </OnboardingShell>
  );
}
