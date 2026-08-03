import type { Metadata } from "next";

import { FlowSection } from "@/features/landing/components/flow-section";
import { LandingHero } from "@/features/landing/components/landing-hero";
import {
  CompareSection,
  FeatureSection,
  ProblemSection,
} from "@/features/landing/components/landing-sections";
import { LandingShell } from "@/features/landing/components/landing-shell";
import { ClosingSection } from "@/features/landing/components/pricing-section";
import { RoleSection } from "@/features/landing/components/role-section";

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
 * 읽는 순서를 그대로 따라간다: **문제 → 흐름 → 기능 → 비교 → 역할 → 시작하기**.
 */
export default function LandingPage() {
  return (
    /* 무대·상단바·푸터는 셸이 그린다 — 밝기 스위치도 거기 있다 */
    <LandingShell>
      <LandingHero />
      <ProblemSection />
      <FlowSection />
      <FeatureSection />
      <CompareSection />
      {/* 요금제 띠는 뺐다 — /pricing이 따로 있고 헤더·마지막 CTA가 동선을 잇는다 */}
      <RoleSection />
      <ClosingSection />
    </LandingShell>
  );
}
