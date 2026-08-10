import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { ScopedThemeProvider } from "@/components/common/scoped-theme";
import { SystemSidebar } from "@/features/system/components/system-sidebar";
import { SYSTEM_NAV } from "@/features/system/nav";
import { SYSTEM_THEME_COOKIE } from "@/features/system/theme";

/**
 * SYSTEM(서비스 운영자) 화면이 공유하는 셸 — 사이드바는 여기 한 번만 그린다.
 * `(shell)` 레이아웃과 같은 구조지만, SYSTEM은 로그인 뒤 화면과 완전히 다른
 * 별도 운영 도구라 셸도 따로 둔다(CLAUDE.md §라우트 그룹: `(system)`은 별도 그룹).
 *
 * ⚠️ **여기는 다크가 기본이다**(2026-08-09 확정). 하루 종일 큐·실패 목록을 보는 운영 화면이라
 *    밝은 바탕이 오래 보기 힘들고, 사용자 화면과 섞이지 않는다는 신호도 된다.
 * ⚠️ 그래도 **바꿀 수 있어야 한다** — 상단바 토글은 그대로 산다. 다만 그 선택은 **이 셸
 *    안에서만** 살아서(`ScopedThemeProvider`), 운영자 화면을 밝게 봤다고 사용자 화면까지
 *    밝아지지 않는다.
 * ⚠️ 쿠키를 읽으므로 이 레이아웃은 동적이다. 어차피 목 데이터라 캐시할 것이 없다.
 * ⚠️ **`text-foreground`를 여기서 다시 잡는다.** `var()`는 그 값을 쓴 요소에서 풀리는데,
 *    `text-foreground`는 `<body>`(범위 밖)에 걸려 있어 라이트 먹색으로 이미 계산돼 버린다 —
 *    상자에 `.dark`만 붙이면 변수는 바뀌어도 글자색은 상속된 먹색 그대로라 어두운 바탕에
 *    어두운 글자가 된다. 실제로 제목과 큰 숫자가 통째로 안 보였다.
 *
 * ⚠️ 지금은 목업(더미) 단계다 — 로그인이 붙기 전까지 계정 정보는 고정값이다.
 */
export default async function SystemLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  // 고른 적이 없으면 다크다 — `light`를 명시적으로 골랐을 때만 밝게 연다
  const initialDark = store.get(SYSTEM_THEME_COOKIE)?.value !== "light";

  return (
    <ScopedThemeProvider
      initialDark={initialDark}
      cookieName={SYSTEM_THEME_COOKIE}
      className="app-shell bg-background text-foreground h-screen-z flex overflow-hidden"
    >
      <SystemSidebar sections={SYSTEM_NAV} account={{ email: "admin@getz.kr" }} />
      <div className="bg-background flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </ScopedThemeProvider>
  );
}
