import Link from "next/link";

import { ZLogo } from "@/components/icons/z-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 로그인 전 상단바 — 로고와 두 개의 길만 둔다. */
export function LandingHeader() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1144px] items-center justify-between px-7">
        <Link href="/" aria-label="Z 홈" className="flex items-center gap-[7px]">
          <ZLogo className="text-foreground size-[18px]" title="Z" />
          <span className="translate-y-px text-base leading-6 font-semibold tracking-[-0.4px]">
            Z
          </span>
        </Link>

        <nav className="flex items-center gap-[7px]">
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
