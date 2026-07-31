import type { ReactNode } from "react";

import { ROLE } from "@/constants/domain";
import { RoleSidebar } from "@/features/shell/components/role-sidebar";
import { OWNER_NAV } from "@/features/shell/nav";

/**
 * 역할별 대시보드가 공유하는 셸.
 *
 * ⚠️ **레이아웃은 이 하나뿐이다.** `/owner`·`/manage`·`/team`·`/my`가 같은 껍데기를 쓰고
 *    네비 구성만 달라진다(CLAUDE.md §라우트 그룹: 4벌 복붙 금지).
 * ⚠️ 지금은 OWNER 구성만 있다. 로그인이 붙으면 **세션의 역할**로 골라 넘긴다 —
 *    지금 넘기는 사용자는 목이다.
 */
export default function RoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-secondary flex h-dvh overflow-hidden">
      <RoleSidebar sections={OWNER_NAV} user={{ name: "김서준", role: ROLE.OWNER }} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
