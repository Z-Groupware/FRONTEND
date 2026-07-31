import type { Metadata } from "next";

import { Checkout } from "@/features/billing/components/checkout";

export const metadata: Metadata = {
  title: "결제",
};

/**
 * 구독 결제 — `/pricing`에서 Team 플랜을 고르면 넘어온다.
 *
 * ⚠️ **OWNER 전용이다**(명세 §1-4). 지금은 화면만 있고 서버 검사가 없다 —
 *    로그인·Server Action이 붙으면 서버에서 역할을 재검사한다(CLAUDE.md §권한).
 */
export default function BillingCheckoutPage() {
  return <Checkout />;
}
