import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DarkSection } from "./dark-section";

/** 마지막 한 번 더 — 여기까지 읽었으면 시작할 마음이 있는 사람이다. */
export function ClosingSection() {
  return (
    <DarkSection className="py-28 lg:py-36">
      <div className="reveal-on-scroll relative flex flex-col items-center gap-6 text-center">
        <h2 className="text-[36px] leading-[44px] font-semibold tracking-[-0.9px] break-keep lg:text-[48px] lg:leading-[56px]">
          지금 Z를 시작해 보세요
        </h2>
        <p className="text-landing-dark-muted text-[16px] leading-6 break-keep">
          결제 없이 바로 시작할 수 있어요
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <Link
            href="/plans"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-landing-dark-border text-landing-dark-foreground hover:bg-landing-dark-surface h-11 rounded-lg bg-transparent px-5 text-[14px]",
            )}
          >
            요금제 보기
          </Link>
          {/* 검정 위라 버튼은 흰 바탕에 먹색 글자로 뒤집는다 */}
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              "bg-foreground text-background hover:bg-foreground/90 h-11 gap-1.5 rounded-lg px-6 text-[14px]",
            )}
          >
            무료로 시작하기
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </DarkSection>
  );
}
