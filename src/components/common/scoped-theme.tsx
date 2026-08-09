"use client";

import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

import { cn } from "@/lib/utils";

interface ScopedTheme {
  isDark: boolean;
  toggle: () => void;
  /**
   * 이 범위의 상자 — **포털이 여기로 들어가야** 다크가 따라온다.
   *
   * ⚠️ Dialog·Sheet·Select는 기본으로 `<body>`에 그려진다. 그러면 범위 밖이라 전역 밝기를
   *    쓰고, 다크로 보는 운영자 화면 위에 **흰 창**이 뜬다(실제로 그랬다).
   * ⚠️ 상자에 `overflow-hidden`이 있어도 `position: fixed`인 창은 안 잘린다 — 자르려면
   *    조상에 `transform`·`filter` 같은 것이 있어야 하는데 이 상자엔 없다.
   */
  portalContainer: HTMLElement | null;
}

const ScopedThemeContext = createContext<ScopedTheme | null>(null);

/**
 * 범위 테마 안이면 그 상태를, 밖이면 `null`을 준다.
 * `null`이면 부르는 쪽이 앱 전역 테마(next-themes)를 그대로 쓴다.
 */
export function useScopedTheme(): ScopedTheme | null {
  return useContext(ScopedThemeContext);
}

interface ScopedThemeProviderProps {
  /** 서버가 쿠키에서 읽어 넘긴 초기값 — 첫 페인트가 곧바로 맞는 밝기로 그려진다 */
  initialDark: boolean;
  cookieName: string;
  /** 껍데기에 그대로 붙는 클래스 — 여기에 `dark`가 더해진다 */
  className?: string;
  children: ReactNode;
}

/**
 * **화면 일부만** 밝기를 따로 갖게 한다.
 *
 * ⚠️ `.dark`를 `<html>`이 아니라 **이 상자에 붙인다.** globals.css의 다크 토큰이
 *    `.dark { … }`(클래스 선택자)라, 상자에 붙이면 그 안쪽만 뒤집힌다 —
 *    `dark:` 유틸리티도 `&:is(.dark *)`라 함께 따라온다.
 * ⚠️ **next-themes를 또 얹지 않는다.** 그건 `<html>`에 클래스를 쓰므로 둘이 같은 자리를
 *    두고 싸운다. 여기 상태는 이 상자 안에서만 산다 — 운영자 화면을 어둡게 봤다고
 *    사용자 화면까지 어두워지면 안 된다.
 * ⚠️ **localStorage가 아니라 쿠키다.** 클래스를 React가 든 상자에 붙이므로, 첫 페인트 전에
 *    돌릴 스크립트를 걸 자리가 없다 — 서버가 쿠키를 읽어 처음부터 맞는 밝기로 그려 보내야
 *    새로고침할 때 화면이 번쩍이지 않는다(랜딩 밝기가 head 스크립트를 쓰는 것과 같은 이유,
 *    거기는 `<html>`이라 스크립트가 가능했다).
 */
export function ScopedThemeProvider({
  initialDark,
  cookieName,
  className,
  children,
}: ScopedThemeProviderProps) {
  const [isDark, setIsDark] = useState(initialDark);
  // ⚠️ ref가 아니라 state다 — 첫 렌더에 `null`이던 것이 채워질 때 포털이 다시 그려져야 한다
  const [scopeElement, setScopeElement] = useState<HTMLElement | null>(null);

  /*
    쿠키는 **업데이터 밖에서** 쓴다.
    업데이터는 순수해야 하고 Strict Mode는 개발 중에 일부러 두 번 부른다 — 안에 두면
    부수 효과가 두 번 돈다. 값이 같아 눈에 띄진 않지만, React가 한쪽 호출을 버리는
    구조라 기대면 안 되는 자리다. 부수 효과는 이벤트 핸들러에서 한다.
  */
  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    // 1년 — 다음 방문에 서버가 같은 밝기로 그려 보낸다
    document.cookie = `${cookieName}=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  }, [isDark, cookieName]);

  return (
    <ScopedThemeContext.Provider value={{ isDark, toggle, portalContainer: scopeElement }}>
      <div ref={setScopeElement} className={cn(className, isDark && "dark")}>
        {children}
      </div>
    </ScopedThemeContext.Provider>
  );
}
