import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HERO_NOTE } from "../content";
import { AppPreview } from "./app-preview";

/** 첫 화면 — 한 문장으로 무엇을 하는 서비스인지 말한다. */
export function LandingHero() {
  return (
    <section className="border-border border-b py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1144px] items-center gap-14 px-7 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-5">
          <span className="border-border bg-secondary text-muted-foreground flex items-center gap-[7px] rounded-full border px-2.5 py-1 text-[11px] leading-4">
            <span className="bg-foreground size-[5px] rounded-full" aria-hidden />
            베타 오픈
          </span>

          {/*
            ⚠️ 시안은 두 번째 줄에 파랑→보라 그러데이션을 썼다. 쓰지 않는다 —
               색으로 알리는 건 에러뿐이고(§디자인 토큰), 다크모드에서 대비도 무너진다.
               강조는 굵기로 준다.
          */}
          <h1 className="text-[44px] leading-[52px] font-semibold tracking-[-1.3px] break-keep lg:text-[60px] lg:leading-[66px] lg:tracking-[-1.9px]">
            회의를 하면,
            <br />
            조직의 기억이 된다
          </h1>

          <p className="text-muted-foreground max-w-[460px] text-[17px] leading-[29px] break-keep">
            회의가 끝나면 결정과 할 일이 담당자에게 배정돼요. 사람이 바뀌어도 맥락은 남습니다.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              href="/register"
              className={cn(
                buttonVariants(),
                "bg-foreground text-background hover:bg-foreground/90 h-12 gap-1.5 rounded-lg px-6 text-[15px]",
              )}
            >
              무료로 시작하기
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 rounded-lg px-6 text-[15px]",
              )}
            >
              요금제 보기
            </Link>
          </div>

          <p className="text-muted-foreground/70 text-[12px] leading-[18px]">{HERO_NOTE}</p>
        </div>

        <AppPreview />
      </div>
    </section>
  );
}
