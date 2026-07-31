import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 검정 섹션 — 밝은 섹션 사이에 끼워 스크롤에 리듬을 준다.
 *
 * ⚠️ 이 섹션은 **테마와 무관하게 어둡다**(토큰 `--landing-dark-*`).
 *    로그인 전 화면이라 라이트/다크가 갈리면 랜딩 톤이 통째로 흔들린다.
 * ⚠️ 번진 광원은 `aria-hidden`이다 — 읽을 내용이 아니라 배경이다.
 */
export function DarkSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "bg-landing-dark text-landing-dark-foreground relative overflow-hidden py-20 lg:py-28",
        className,
      )}
    >
      {/* 번진 광원 둘 — 검정이 평평해 보이지 않게 깊이를 준다 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-32 size-[420px] rounded-full bg-[#2563eb] opacity-25 blur-[120px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-24 size-[420px] rounded-full bg-[#7c3aed] opacity-25 blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-[1144px] px-7">{children}</div>
    </section>
  );
}
