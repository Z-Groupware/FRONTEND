"use client";

import Link from "next/link";

import { SuccessDialog } from "@/components/common/success-dialog";

import { BILLING_CYCLE_LABEL, type BillingCycle, formatWon, type PriceBreakdown } from "../pricing";
import type { Plan } from "../types";

interface PaymentDoneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan;
  cycle: BillingCycle;
  price: PriceBreakdown;
}

/**
 * 결제 완료 안내 — 모양은 공용 `SuccessDialog`가 잡고, 여기서는 **무엇을 결제했는지**만 채운다.
 *
 * ⚠️ **실제 결제는 일어나지 않는다.** Toss 연동 전이라 버튼을 누르면 이 창만 뜬다 —
 *    연동되면 결제 성공 응답을 받은 뒤에 연다.
 */
export function PaymentDoneDialog({
  isOpen,
  onOpenChange,
  plan,
  cycle,
  price,
}: PaymentDoneDialogProps) {
  return (
    <SuccessDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="결제가 완료됐어요"
      description={
        // 두 문장이라 줄을 나눈다 — 한 줄로 흘리면 어디서 끊길지 화면 폭에 맡기게 된다
        <>
          {plan.name} 플랜을 쓰실 수 있어요.
          <br />
          영수증은 등록한 메일로 보내드립니다.
        </>
      }
      action={
        <Link
          href="/owner"
          className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-ring flex h-[38px] w-full items-center justify-center rounded-md text-[13px] leading-none transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          대시보드로 가기
        </Link>
      }
    >
      <dl className="border-border flex flex-col gap-2.5 rounded-lg border p-4 text-[13px]">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">플랜</dt>
          <dd>
            {plan.name} ({BILLING_CYCLE_LABEL[cycle]})
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">구성원</dt>
          <dd className="tabular-nums">{price.seats}명</dd>
        </div>
        <div className="border-border mt-0.5 flex items-baseline justify-between border-t pt-3">
          <dt className="font-semibold">결제 금액</dt>
          <dd className="text-[15px] font-semibold tabular-nums">{formatWon(price.total)}</dd>
        </div>
      </dl>
    </SuccessDialog>
  );
}
