import type { Metadata } from "next";

import { BillingView } from "@/features/billing/components/billing-view";
import { getBillingConfig, getBillingOverview } from "@/features/billing/server";
import { canManageBilling, getViewer } from "@/features/shell/viewer";

export const metadata: Metadata = {
  title: "구독·결제",
};

/*
  ⚠️ **정적으로 굽히면 안 된다.** 아래에서 오늘 날짜를 만드는데, 미리 구우면 그 날짜가
     빌드 시각에 박혀 사용량 예측이 며칠씩 어긋난다.
*/
export const dynamic = "force-dynamic";

/**
 * 구독·결제 — 지금 무엇을 얼마에 쓰는지 보고, 플랜·결제 수단을 바꾸고, 지난 결제를 확인한다.
 *
 * ⚠️ 조회는 **Server Component**가 한다 — `useEffect` 페칭을 쓰지 않는다(CLAUDE.md §렌더링).
 * ⚠️ **OWNER 또는 Admin 겸직자만** 볼 수 있다. 지금은 로그인이 없어 화면 가드만 있고,
 *    Server Action·BFF가 붙으면 `canManageBilling`으로 서버에서 재검사한다 —
 *    화면 숨김은 UX일 뿐 보안이 아니다(§권한).
 */
export default async function OwnerBillingPage() {
  const [overview, config, viewer] = await Promise.all([
    getBillingOverview(),
    getBillingConfig(),
    getViewer(),
  ]);

  /*
    ⚠️ 판정은 **`canManageBilling` 한 곳**이 한다. 전에는 여기만 `const canManage = true`로
       손으로 두어서, 같은 판정을 하는 `/subscription`과 규칙이 갈라져 있었다 —
       권한을 화면마다 적으면 한쪽만 고치고 지나간다(CLAUDE.md §권한).
    ⚠️ 잠긴 화면을 보려면 `viewer.ts`의 목을 바꾼다.
  */
  const canManage = canManageBilling(viewer);

  /*
    ⚠️ 오늘 날짜를 **서버에서** 만든다. 월말 예측에 쓰이는 값이라 브라우저 시계를 믿으면
       시계를 돌려 놓은 사람에게 다른 예측이 보인다.
  */
  const today = new Date().toISOString().slice(0, 10);

  return <BillingView overview={overview} config={config} today={today} canManage={canManage} />;
}
