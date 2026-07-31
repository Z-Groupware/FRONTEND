import type { ReactNode } from "react";

import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHeader } from "@/features/landing/components/landing-header";

/**
 * 로그인 전 화면이 공유하는 껍데기.
 *
 * ⚠️ 셸(사이드바)이 없다 — 아직 로그인하지 않은 사람이 보는 화면이다.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
