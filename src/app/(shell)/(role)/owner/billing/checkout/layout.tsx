import type { ReactNode } from "react";
import { Suspense } from "react";

import { CheckoutHeader } from "@/features/billing/components/checkout-header";
import { PageHeader } from "@/features/shell/components/page-header";

/**
 * 결제 화면의 상단바.
 *
 * ⚠️ 결제는 **구독 관리의 탭이 아니라 별도 흐름**이다 — 제목이 다르고 탭도 없다.
 *    그래서 `billing`이 아니라 `checkout` 아래에 레이아웃을 둔다.
 * ⚠️ 뒤로가기는 **들어온 길에 따라 달라진다**(`CheckoutHeader` 주석 참고).
 *    쿼리를 읽어야 해서 클라이언트 컴포넌트이고, `useSearchParams`는 Suspense가 필요하다 —
 *    없으면 이 화면 전체가 정적 렌더에서 빠진다.
 */
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<PageHeader title="결제" />}>
        <CheckoutHeader />
      </Suspense>
      {children}
    </>
  );
}
