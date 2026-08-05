import type { ReactNode } from "react";

import { getUnreadNoticeCount } from "@/features/notice/server";
import { RoleSidebar } from "@/features/shell/components/role-sidebar";
import type { NavSection } from "@/features/shell/nav";
import { dashboardFor, navFor } from "@/features/shell/nav-config";
import { getViewer } from "@/features/shell/viewer";

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
 * ⚠️ `(role)`(역할·관리 화면) · `(app)`(공용 워크벤치)이 이 아래에 나란히 들어온다.
 *    괄호는 URL에 안 들어가므로 주소는 `/owner`·`/manage/billing`·`/app/meeting`이다.
 *    두 그룹을 오갈 때 사이드바가 다시 마운트되지 않아 깜빡이지 않는다.
 * ⚠️ 역할마다 **레이아웃이 아니라 `sections`만** 갈아 끼운다(CLAUDE.md §라우트 그룹).
 *    지금은 OWNER 구성뿐이다 — 로그인이 붙으면 세션의 역할로 고른다(지금 사용자는 목).
 */
export default async function ShellLayout({ children }: { children: ReactNode }) {
  /*
    ⚠️ 둘을 **같이 기다린다.** 앞뒤로 세우면 사이드바 하나 그리는 데 두 번 기다린다.
    ⚠️ 사용자는 `getViewer()`가 준다 — 전에는 여기에 `{ name: "대표 계정", role: OWNER }`를
       손으로 적고 있었다. 로그인이 붙으면 그 파일 하나만 바뀐다(#67).
    ⚠️ **공지 수는 실패해도 셸을 죽이지 않는다.** 빨간 점 하나 때문에 로그인 뒤 화면 전체가
       안 뜨면 안 된다 — 못 읽으면 0으로 본다(점만 안 붙는다).
       반대로 **사용자를 못 읽으면 그건 터뜨린다.** 누군지 모르는 채로 그린 사이드바는
       메뉴·권한이 틀린 화면이라, 조용히 넘기면 더 나쁘다.
  */
  const [viewer, unreadNoticeCount] = await Promise.all([
    getViewer(),
    getUnreadNoticeCount().catch(() => 0),
  ]);
  /*
    ⚠️ **역할이 목록을 정한다.** 전에는 `OWNER_NAV` 하나를 모두에게 줘서, 팀장·사원으로
       로그인해도 대표 메뉴가 그대로 떴다. `is_admin` 겸직도 아무 표시가 없었다.
  */
  const sections = withNoticeDot(navFor(viewer), unreadNoticeCount > 0);

  return (
    // ⚠️ `h-screen-z` — 화면 배율(zoom)이 걸려도 셸이 아래에서 안 잘린다(§화면 배율)
    <div className="bg-background h-screen-z flex overflow-hidden">
      <RoleSidebar sections={sections} home={dashboardFor(viewer.role)} user={viewer} />

      {/*
        상단바는 여기서 그리지 않는다 — 제목·액션이 도메인마다 달라서
        각 도메인의 `layout.tsx`가 `PageHeader`를 그린다.
        ⚠️ 점 그리드는 본문에만 깐다. 사이드바·상단바는 불투명 배경이라 그 위를 덮는다.
      */}
      <div className="bg-dot-grid flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
