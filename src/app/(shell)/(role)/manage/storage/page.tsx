import type { Metadata } from "next";

import { getBillingConfig } from "@/features/billing/server";
import { getViewer } from "@/features/shell/viewer";
import { StorageView } from "@/features/storage/components/storage-view";
import { getStorageOverview } from "@/features/storage/server";
import { canManageStorage } from "@/lib/permission";

export const metadata: Metadata = {
  title: "녹음 용량",
};

/**
 * 녹음 용량 — 얼마나 찼는지 보고, 끝난 프로젝트의 음성을 지운다.
 *
 * ⚠️ 조회는 **Server Component**가 한다 — `useEffect` 페칭을 쓰지 않는다(§렌더링).
 * ⚠️ 포함량은 `BillingConfig`에서 읽는다. 용량 응답에 총량을 같이 받으면 두 벌이 되어
 *    구독 화면과 다른 숫자를 말하게 된다(§요금제: 정본은 하나다).
 * ⚠️ **OWNER 또는 Admin 겸직자만** 지울 수 있다. 화면 가드는 UX일 뿐이고,
 *    삭제 액션이 `canManageStorage`로 서버에서 다시 본다(§권한).
 */
export default async function ManageStoragePage() {
  const [overview, config, viewer] = await Promise.all([
    getStorageOverview(),
    getBillingConfig(),
    getViewer(),
  ]);

  return <StorageView overview={overview} config={config} canManage={canManageStorage(viewer)} />;
}
