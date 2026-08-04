import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ZLogo } from "@/components/icons/z-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "찾을 수 없는 화면 — Z",
};

/**
 * 없는 주소로 들어왔을 때.
 *
 * ⚠️ Next 기본 화면을 그대로 두지 않는다 — 회색 영문 화면이 뜨면 우리 서비스가 아닌 것처럼 보인다.
 * ⚠️ 셸을 쓰지 않는다. 어떤 라우트 그룹에서 떨어졌는지 알 수 없어, 이 화면만은 혼자 선다.
 * ⚠️ 갈 곳을 준다. 막다른 길에서 뒤로가기만 남기지 않는다.
 */
export default function NotFound() {
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-7 px-6 text-center">
      <Link href="/" aria-label="Z 홈으로" className="focus-visible:ring-ring rounded">
        <ZLogo className="text-foreground size-8" title="Z" />
      </Link>

      <div className="flex flex-col gap-2.5">
        <p className="text-muted-foreground/70 text-[13px] leading-5 tracking-[1.2px] tabular-nums">
          404
        </p>
        <h1 className="text-[24px] leading-8 font-semibold tracking-[-0.5px] break-keep">
          찾으시는 화면이 없습니다
        </h1>
        <p className="text-muted-foreground max-w-[380px] text-[14px] leading-6 break-keep">
          주소가 바뀌었거나 지워진 화면일 수 있습니다. 홈에서 다시 찾아보시겠습니까?
        </p>
      </div>

      <Link
        href="/"
        className={cn(
          buttonVariants(),
          "bg-foreground text-background hover:bg-foreground/90 h-11 gap-1.5 px-5 text-[14px]",
        )}
      >
        <ArrowLeft className="size-4" />
        홈으로 가기
      </Link>
    </main>
  );
}
