import type { ReactNode } from "react";

import { SystemSidebar } from "@/features/system/components/system-sidebar";
import { SYSTEM_NAV } from "@/features/system/nav";

/**
 * SYSTEM(서비스 운영자) 화면이 공유하는 셸 — 사이드바는 여기 한 번만 그린다.
 * `(shell)` 레이아웃과 같은 구조지만, SYSTEM은 로그인 뒤 화면과 완전히 다른
 * 별도 운영 도구라 셸도 따로 둔다(CLAUDE.md §라우트 그룹: `(system)`은 별도 그룹).
 *
 * ⚠️ 지금은 목업(더미) 단계다 — 로그인이 붙기 전까지 계정 정보는 고정값이다.
 */
export default function SystemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell bg-background h-screen-z flex overflow-hidden">
      <SystemSidebar sections={SYSTEM_NAV} account={{ email: "admin@getz.kr" }} />
      <div className="bg-background flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
