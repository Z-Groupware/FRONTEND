import type { Metadata } from "next";

import { OnboardingDone } from "@/features/onboarding/components/onboarding-done";

export const metadata: Metadata = {
  title: "초기 설정 완료",
};

export default function OnboardingDonePage() {
  return <OnboardingDone />;
}
