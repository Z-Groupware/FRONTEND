import type { Metadata } from "next";

import { OrgChartView } from "@/features/member/components/org-chart-view";
import { getOrgChart } from "@/features/member/org-server";

export const metadata: Metadata = {
  title: "구성원",
};

/**
 * 구성원 조직도 — **조회뿐이라 Server Component 하나로 끝난다**(§핵심 4원칙 1).
 *
 * ⚠️ 권한 가드가 없다. `(app)`은 로그인한 전원이 쓰는 공용 워크벤치이고, 조직도는
 *    회사 사람이면 누구나 보는 것이다(WORKFLOW §9의 사원 관리와 다른 화면이다).
 */
export default async function AppPeoplePage() {
  const chart = await getOrgChart();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1440px]">
        <OrgChartView chart={chart} />
      </div>
    </main>
  );
}
