import { Check, Rocket, Users } from "lucide-react";
import type { Metadata } from "next";

import { PlanCompare } from "@/features/billing/components/plan-compare";
import { PLANS } from "@/features/billing/plans";
import { DocPage } from "@/features/landing/components/doc-page";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "요금제 — Z",
  description: "Free로 시작해서 팀이 커지면 Team으로 넘어가면 됩니다.",
};

/**
 * 랜딩에서 들어오는 요금제 소개.
 *
 * ⚠️ **온보딩의 `/pricing`과 다른 화면이다.** 저긴 가입 흐름 안에서 플랜을 **고르는** 단계고,
 *    여긴 가입 전에 가격을 **구경하는** 페이지다 — 그래서 셸도 랜딩 껍데기를 쓴다.
 *    플랜 데이터(`PLANS`·`PLAN_COMPARE`)는 한 곳을 같이 읽으므로 값이 어긋날 일은 없다.
 * ⚠️ 껍데기·제목은 다른 설명 문서(`/terms`·`/roles`·`/location`)와 **같은 `DocPage`** 를 쓴다.
 *    여기만 가운데 정렬 제목을 따로 쓰니 같은 사이트로 안 읽혔다.
 */
export default function PlansPage() {
  return (
    <DocPage
      title="요금제"
      description="Free로 시작해서 팀이 커지면 Team으로 넘어가면 됩니다."
      isWide
      hasClosing={false}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <section
            key={plan.code}
            className={cn(
              // ⚠️ RGB 링은 **밀어주는 플랜 한 장**만 상시로 두른다. 나머지에 호버로 켜면
              //    링이 도는 데 한 바퀴가 걸려 굼떠 보이고, 강조해야 할 카드도 흐려진다
              "bg-card relative rounded-2xl border p-7 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-[2px]",
              plan.isRecommended
                ? "glow-ring-rgb border-transparent shadow-[0_18px_50px_-18px_rgba(124,58,237,0.45)]"
                : "border-border ring-rgb-static hover:shadow-[0_10px_28px_-14px_rgba(124,58,237,0.32)]",
            )}
          >
            {plan.isRecommended && (
              <span className="bg-foreground text-background absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] leading-4 whitespace-nowrap">
                가장 많이 선택해요
              </span>
            )}
            {/* 플랜 아이콘 — 이름만 있으면 카드 머리가 비어 보인다 */}
            <span className="bg-foreground/[0.07] text-foreground mb-3 flex size-9 items-center justify-center rounded-lg">
              {plan.isRecommended ? (
                <Users className="size-4" aria-hidden />
              ) : (
                <Rocket className="size-4" aria-hidden />
              )}
            </span>
            <h2 className="text-[16px] leading-6 font-semibold">{plan.name}</h2>
            <p className="pt-2 text-[32px] leading-10 font-semibold tracking-[-0.6px] tabular-nums">
              {plan.price}
            </p>
            <p className="text-muted-foreground text-[13px] leading-5">{plan.unit}</p>

            <ul className="flex flex-col gap-2.5 pt-6">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-[14px] leading-[21px] break-keep"
                >
                  <Check
                    className="text-foreground size-4 shrink-0"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* 시작 버튼은 두지 않는다 — 상단바의 [무료로 시작하기]가 그 역할이다 */}
      {/* 표 제목 위계는 /roles의 "기능별 정리"와 같은 문법 — 문서끼리 같은 손으로 읽힌다 */}
      <h2 className="pt-14 text-[20px] leading-7 font-semibold tracking-[-0.4px]">플랜별 기능</h2>
      <p className="text-muted-foreground pt-1.5 pb-5 text-[13px] leading-[21px] break-keep">
        두 플랜의 차이를 한 줄씩 확인하세요.
      </p>
      {/* 위 플랜 카드와 같은 가로폭 — 폭이 다르면 두 덩어리가 따로 논다 */}
      <PlanCompare isFullWidth />
    </DocPage>
  );
}
