import type { ReactNode } from "react";

import { ROLE } from "@/constants/domain";
import { RoleSidebar } from "@/features/shell/components/role-sidebar";
import { OWNER_NAV } from "@/features/shell/nav";

/**
 * 로그인 뒤 화면이 모두 쓰는 셸 — **사이드바는 여기 한 번만** 그린다.
 *
 * ⚠️ `(role)`(역할 전용)과 `(app)`(공용 워크벤치)이 이 아래에 나란히 들어온다.
 *    괄호는 URL에 안 들어가므로 주소는 그대로 `/owner`·`/app/meeting`이다.
 *    두 그룹을 오갈 때 사이드바가 다시 마운트되지 않아 깜빡이지 않는다.
 * ⚠️ 역할마다 **레이아웃이 아니라 `sections`만** 갈아 끼운다(CLAUDE.md §라우트 그룹).
 *    지금은 OWNER 구성뿐이다 — 로그인이 붙으면 세션의 역할로 고른다(지금 사용자는 목).
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <RoleSidebar sections={OWNER_NAV} user={{ name: "김서준", role: ROLE.OWNER }} />
      {/*
        상단바는 여기서 그리지 않는다 — 제목·액션이 도메인마다 달라서
        각 도메인의 `layout.tsx`가 `PageHeader`를 그린다.
      */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
