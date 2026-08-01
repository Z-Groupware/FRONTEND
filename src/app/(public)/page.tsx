import type { Metadata } from "next";

import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { LandingHero } from "@/features/landing/components/landing-hero";
import {
  CompareSection,
  FeatureSection,
  FlowSection,
  ProblemSection,
} from "@/features/landing/components/landing-sections";
import { ClosingSection, PricingSection } from "@/features/landing/components/pricing-section";
import { RoleSection } from "@/features/landing/components/role-section";
import { ScreenMarquee } from "@/features/landing/components/screen-marquee";

export const metadata: Metadata = {
  title: "Z — 회의를 하면, 조직의 기억이 된다",
  description: "회의가 끝나면 결정과 할 일이 담당자에게 배정돼요. 사람이 바뀌어도 맥락은 남습니다.",
};

/**
 * 랜딩 — 로그인 전 첫 화면.
 *
 * ⚠️ 상단바·푸터를 `(public)/layout.tsx`에 두지 않는다 — 그 레이아웃은 `/pricing`까지 감싸서
 *    온보딩 셸 위에 랜딩 껍데기가 덧씌워진다. 랜딩만 쓰는 껍데기는 랜딩이 직접 그린다.
 *
 * 읽는 순서를 그대로 따라간다: **문제 → 흐름 → 기능 → 역할 → 비교 → 요금제 → 시작하기**.
 */
export default function LandingPage() {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <LandingHeader />

      <main className="flex-1">
        <LandingHero />
        <ScreenMarquee />
        <ProblemSection />
        <FlowSection />
        <FeatureSection />
        <RoleSection />
        <CompareSection />
        <PricingSection />
        <ClosingSection />
      </main>

      <LandingFooter />
    </div>
  );
}
