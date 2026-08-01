import type { Metadata } from "next";

import { DepartmentSetup } from "@/features/onboarding/components/department-setup";
import { OnboardingShell } from "@/features/onboarding/components/onboarding-shell";
import { getDepartments } from "@/features/onboarding/server";
import { ONBOARDING_STEP } from "@/features/onboarding/types";

export const metadata: Metadata = {
  title: "부서 체계 만들기",
};

export default async function OnboardingDepartmentPage() {
  const departments = await getDepartments();

  return (
    <OnboardingShell step={ONBOARDING_STEP.DEPARTMENT}>
      <DepartmentSetup initialDepartments={departments} />
    </OnboardingShell>
  );
}
