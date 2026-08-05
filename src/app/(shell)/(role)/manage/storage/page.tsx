import type { Metadata } from "next";

import { getBillingConfig } from "@/features/billing/server";
import { getViewer } from "@/features/shell/viewer";
import { StorageView } from "@/features/storage/components/storage-view";
import { getStorageOverview } from "@/features/storage/server";
import { todayIso } from "@/lib/date";
import { canManageStorage } from "@/lib/permission";

export const metadata: Metadata = {
  title: "저장소 관리",
};

/**
 * 녹음 용량 — 얼마나 찼는지 보고, 끝난 프로젝트의 음성을 지운다.
 *
 * ⚠️ 조회는 **Server Component**가 한다 — `useEffect` 페칭을 쓰지 않는다(§렌더링).
 * ⚠️ 포함량은 `BillingConfig`에서 읽는다. 용량 응답에 총량을 같이 받으면 두 벌이 되어
 *    구독 화면과 다른 숫자를 말하게 된다(§요금제: 정본은 하나다).
 * ⚠️ **OWNER 또는 Admin 겸직자만** 지울 수 있다. 화면 가드는 UX일 뿐이고,
 *    삭제 액션이 `canManageStorage`로 서버에서 다시 본다(§권한).
 * ⚠️ **기준 날짜(`today`)는 여기서 정해 내려보낸다.** 표는 클라이언트 컴포넌트라 거기서
 *    `new Date()`를 부르면 날짜가 바뀌는 순간 서버 렌더와 갈려 하이드레이션이 어긋난다 —
 *    `4개월 전` 같은 표기는 전부 이 값 하나에서 계산된다.
 */
export default async function ManageStoragePage() {
  const [overview, config, viewer] = await Promise.all([
    getStorageOverview(),
    getBillingConfig(),
    getViewer(),
  ]);

  return (
    <StorageView
      overview={overview}
      config={config}
      canManage={canManageStorage(viewer)}
      today={todayIso()}
    />
  );
}
