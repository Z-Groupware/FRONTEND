import type { ReactNode } from "react";

import { ROLE } from "@/constants/domain";
import { getUnreadNoticeCount } from "@/features/notice/server";
import { RoleSidebar } from "@/features/shell/components/role-sidebar";
import type { NavSection } from "@/features/shell/nav";
import { OWNER_NAV } from "@/features/shell/nav";

/**
 * 공지 미읽음이 있으면 사이드바 "공지" 항목에 빨간 점을 끼워 넣는다.
 * ⚠️ 정적 `OWNER_NAV`를 그대로 두고 **여기서 서버 상태(미읽음 수)만 얹는다** — 구성과 상태를
 *    한 파일에 섞지 않는다. 읽음 처리(`markNoticeReadAction`)가 `revalidatePath`로 이 셸을 다시 그린다.
 */
function withNoticeDot(sections: NavSection[], hasUnread: boolean): NavSection[] {
  if (!hasUnread) return sections;
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.href === "/app/notice" ? { ...item, dot: true } : item,
    ),
  }));
}

/**
 * 로그인 뒤 화면이 모두 쓰는 셸 — **사이드바는 여기 한 번만** 그린다.
 *
 * ⚠️ `(role)`(역할 전용)과 `(app)`(공용 워크벤치)이 이 아래에 나란히 들어온다.
 *    괄호는 URL에 안 들어가므로 주소는 그대로 `/owner`·`/app/meeting`이다.
 *    두 그룹을 오갈 때 사이드바가 다시 마운트되지 않아 깜빡이지 않는다.
 * ⚠️ 역할마다 **레이아웃이 아니라 `sections`만** 갈아 끼운다(CLAUDE.md §라우트 그룹).
 *    지금은 OWNER 구성뿐이다 — 로그인이 붙으면 세션의 역할로 고른다(지금 사용자는 목).
 */
export default async function ShellLayout({ children }: { children: ReactNode }) {
  const unreadNoticeCount = await getUnreadNoticeCount();
  const sections = withNoticeDot(OWNER_NAV, unreadNoticeCount > 0);

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <RoleSidebar sections={sections} user={{ name: "대표 계정", role: ROLE.OWNER }} />

      {/*
        상단바는 여기서 그리지 않는다 — 제목·액션이 도메인마다 달라서
        각 도메인의 `layout.tsx`가 `PageHeader`를 그린다.
        ⚠️ 점 그리드는 본문에만 깐다. 사이드바·상단바는 불투명 배경이라 그 위를 덮는다.
      */}
      <div className="bg-dot-grid flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
