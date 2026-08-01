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
      style={{ "--width": "300px" } as React.CSSProperties}
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
          // 한 줄짜리 알림이 대부분이라 가운데 정렬로 둔다.
          // ⚠️ 설명(description)이 붙는 토스트는 호출할 때 `classNames`로 왼쪽 정렬을 준다 —
          //    두 줄이 가운데 정렬되면 줄 끝이 들쭉날쭉해 읽기 어렵다.
          toast: "items-center justify-center rounded-2xl text-center text-[13px] shadow-md gap-2",
          title: "font-medium!",
          description: "text-background/70! text-xs! leading-[18px]!",
          // ⚠️ sonner 기본 성공 아이콘은 **초록**이다. 색으로 알리는 건 에러뿐이라 글자색을 따르게 한다.
          icon: "text-background! m-0! size-4! shrink-0 [&>svg]:size-4 [&_*]:fill-current [&_*]:stroke-current",
          actionButton: "bg-background! text-foreground!",
          cancelButton: "bg-background/20! text-background!",
        },
      }}
      {...props}
    />
  );
}
