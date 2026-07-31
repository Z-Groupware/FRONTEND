"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * 변경 결과 토스트(DECISIONS: 토스트 — 결과 피드백).
 * 루트 레이아웃에 **하나만** 둔다.
 *
 * ⚠️ 색은 토큰만 쓴다 — 먹색 배경/밝은 글자라 다크에서도 자동으로 뒤집힌다.
 */
export function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      // 컨테이너 폭을 줄여 토스트가 화면 가운데에 오게 한다.
      // 토스트는 컨테이너 안에서 절대 배치라 margin:auto로는 가운데로 못 민다 —
      // 컨테이너 폭(--width)이 곧 토스트 폭이다.
      style={{ "--width": "248px" } as React.CSSProperties}
      toastOptions={{
        // sonner가 자체 배경색을 먼저 칠한다 — 토큰을 인라인으로 덮어써야 먹색이 유지된다.
        // 순검정으로 보이지 않게 배경색을 한 스푼 섞는다(다크모드에서도 같은 규칙으로 눅는다).
        style: {
          background: "color-mix(in oklab, var(--foreground) 88%, var(--background))",
          color: "var(--background)",
          border: "none",
          padding: "10px 16px",
        },
        classNames: {
          toast: "justify-center rounded-[18px] text-center text-[13px] shadow-md gap-2",
          title: "!font-normal",
          icon: "!text-background !m-0 !size-4",
          actionButton: "!bg-background !text-foreground",
          cancelButton: "!bg-background/20 !text-background",
        },
      }}
      {...props}
    />
  );
}
