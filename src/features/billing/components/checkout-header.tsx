"use client";

import { CreditCard } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/features/shell/components/page-header";

/**
 * 결제 화면 상단바 — **어디서 왔는지에 따라 뒤로가기가 달라진다.**
 *
 * 결제로 들어오는 길이 둘이라 목적지를 하나로 못 박는다.
 *   온보딩 → 요금제 → 결제        : 뒤로가기 없음(가본 적 없는 곳으로 보낼 수 없다)
 *   구독 관리 → 플랜 변경 → 결제   : `?from=billing` → 구독 관리로
 *
 * ⚠️ 레이아웃은 쿼리(`?from=`)를 받지 못한다(페이지만 받는다) — 그래서 헤더만
 *    클라이언트 컴포넌트로 두고 여기서 읽는다.
 */
const BACK_TO = {
  billing: { href: "/owner/billing", label: "구독 관리" },
} as const;

type CheckoutOrigin = keyof typeof BACK_TO;

function isKnownOrigin(value: string | null): value is CheckoutOrigin {
  return value !== null && value in BACK_TO;
}

export function CheckoutHeader() {
  const from = useSearchParams().get("from");

  return (
    <PageHeader
      icon={CreditCard}
      title="결제"
      backTo={isKnownOrigin(from) ? BACK_TO[from] : undefined}
    />
  );
}
