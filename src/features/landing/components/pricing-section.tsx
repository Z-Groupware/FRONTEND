import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DarkSection } from "./dark-section";

/**
 * 요금제로 보내는 띠.
 *
 * ⚠️ **가격표를 여기에 다시 그리지 않는다.** 랜딩에 값을 적으면 요금제 화면과 두 벌이 되고,
 *    가격이 바뀔 때 한쪽만 고쳐져 사용자에게 거짓말이 된다.
 *    `features/billing`의 `PLANS`가 develop에 들어오면(#25) 그걸 읽어 표로 바꾼다.
 */
export function PricingSection() {
  return (
    <section className="border-border border-b py-20 lg:py-28">
      <div className="mx-auto flex w-full max-w-[1144px] flex-col items-center gap-4 px-7 text-center">
        <h2 className="text-[32px] leading-[40px] font-semibold tracking-[-0.7px] break-keep lg:text-[36px] lg:leading-[44px]">
          명확한 요금제
        </h2>
        <p className="text-muted-foreground max-w-[420px] text-[15px] leading-[26px] break-keep">
          Free로 시작해서 팀이 커지면 Team으로 넘어가면 됩니다. 베타 기간에는 둘 다 무료예요.
        </p>
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-2 h-11 rounded-lg px-6 text-[14px]",
          )}
        >
          요금제 자세히 보기
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

/** 마지막 한 번 더 — 여기까지 읽었으면 시작할 마음이 있는 사람이다. */
export function ClosingSection() {
  return (
    <DarkSection>
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-[36px] leading-[44px] font-semibold tracking-[-0.9px] break-keep lg:text-[44px] lg:leading-[52px]">
          지금 Z를 시작해 보세요
        </h2>
        <p className="text-landing-dark-muted text-[16px] leading-6 break-keep">
          결제 없이 바로 시작할 수 있어요
        </p>
        {/* 검정 위라 버튼은 흰 바탕에 먹색 글자로 뒤집는다 */}
        <Link
          href="/register"
          className={cn(
            buttonVariants(),
            "h-12 gap-1.5 rounded-lg bg-white px-7 text-[15px] text-[#0a0a0a] hover:bg-white/90",
          )}
        >
          무료로 시작하기
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </DarkSection>
  );
}
