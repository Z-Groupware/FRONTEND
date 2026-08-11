import type { Metadata } from "next";

import { AccessDenied } from "@/components/common/access-denied";
import { BillingView } from "@/features/billing/components/billing-view";
import { getBillingConfig, getBillingOverview } from "@/features/billing/server";
import { roleHome } from "@/features/shell/home";
import { getViewer } from "@/features/shell/viewer";
import { canAccessManageScope } from "@/lib/permission";
import { canManageBilling } from "@/lib/permission";

export const metadata: Metadata = {
  title: "구독",
};

/*
  ⚠️ **정적으로 굳히지 않는다.** 회사마다 다른 구독 상태·사용량·결제 이력을 그리는 화면이라
     한 벌을 미리 구워 돌려쓸 수 없다.
  ⚠️ 세션이 붙으면 `getViewer()`가 쿠키를 읽어 저절로 동적이 되지만, 목인 지금은
     동적 신호가 하나도 없어 `○`(Static)으로 빌드된다 — 그때 지워도 되는 줄이다.
*/
export const dynamic = "force-dynamic";

/**
 * 구독 — 지금 무엇을 얼마에 쓰는지 보고, 플랜·결제 수단을 바꾸고, 지난 결제를 확인한다.
 *
 * ⚠️ 조회는 **Server Component**가 한다 — `useEffect` 페칭을 쓰지 않는다(CLAUDE.md §렌더링).
 * ⚠️ **OWNER 또는 Admin 겸직자만** 볼 수 있다. 지금은 로그인이 없어 화면 가드만 있고,
 *    Server Action·BFF가 붙으면 `canManageBilling`으로 서버에서 재검사한다 —
 *    화면 숨김은 UX일 뿐 보안이 아니다(§권한).
 */
export default async function OwnerBillingPage() {
  /* ⚠️ 문(권한)을 먼저 본다 — 돈이 걸린 화면이라 판정 전 조회를 한 번도 내보내지 않는다(§권한) */
  const viewer = await getViewer();
  if (!canAccessManageScope(viewer)) return <AccessDenied homeHref={roleHome(viewer.role)} />;

  const [overview, config] = await Promise.all([getBillingOverview(), getBillingConfig()]);

  /*
    ⚠️ 판정은 **`canManageBilling` 한 곳**이 한다. 전에는 여기만 `const canManage = true`로
       손으로 두어서, 같은 판정을 하는 `/subscription`과 규칙이 갈라져 있었다 —
       권한을 화면마다 적으면 한쪽만 고치고 지나간다(CLAUDE.md §권한).
    ⚠️ 잠긴 화면을 보려면 `viewer.ts`의 목을 바꾼다.
  */
  const canManage = canManageBilling(viewer);

  return <BillingView overview={overview} config={config} canManage={canManage} />;
}
