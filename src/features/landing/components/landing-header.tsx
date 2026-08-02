import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PlayfulLogo } from "./playful-logo";
import { ThemeToggle } from "./theme-toggle";

/**
 * 로그인 전 상단바 — 요금제·로그인·시작하기 셋만 둔다. 나머지 동선은 푸터가 잇는다.
 *
 * ⚠️ `sticky`가 아니라 **`fixed`** 다. sticky는 스크롤 위치에 따라 매 프레임 다시 배치되는데,
 *    `backdrop-blur`가 얹혀 있으면 빠르게 굴릴 때 한 박자 늦게 따라와 위로 튕겼다 내려온다.
 *    fixed는 문서 흐름에서 빠져 있어 스크롤과 무관하게 제자리에 붙어 있는다.
 *    빠진 높이(56px)는 셸이 `pt-14`로 메운다 — 둘 중 하나만 바꾸면 첫 화면이 헤더에 가린다.
 */
export function LandingHeader() {
  return (
    <header className="border-border bg-background/80 fixed top-0 right-0 left-0 z-50 [transform:translateZ(0)] border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1144px] items-center justify-between px-7">
        {/* 로고만 둔다 — 옆에 "Z" 글자를 또 쓰면 같은 말이 두 번이다 */}
        {/* 로고 이스터에그 — 홈에서 누르면 조각이 다시 맞춰진다 */}
        <PlayfulLogo />

        <nav className="flex items-center gap-[7px]">
          <ThemeToggle />
          <Link
            href="/plans"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring hidden rounded px-2.5 py-1.5 text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:block"
          >
            요금제
          </Link>
          {/* ⚠️ 로그인·회원가입 화면은 아직 없다. 붙으면 이 링크가 그대로 살아난다 */}
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline" }), "h-[34px] text-[13px]")}
          >
            로그인
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              "bg-foreground text-background hover:bg-foreground/90 h-[34px] text-[13px]",
            )}
          >
            무료로 시작하기
          </Link>
        </nav>
      </div>
    </header>
  );
}
