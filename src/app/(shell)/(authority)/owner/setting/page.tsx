import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyPositionCard } from "@/features/company/components/company-position-card";
import { CompanyProfileCard } from "@/features/company/components/company-profile-card";
import { CompanyTeamCard } from "@/features/company/components/company-team-card";
import { getCompanySetting } from "@/features/company/server";
import { getViewer } from "@/features/shell/viewer";
import { canManageCompany } from "@/lib/permission";

/*
  ⚠️ **정적으로 굳히지 않는다.** 저장하면 값이 바뀌는 화면이라 빌드 시각 값이 박히면
     방금 고친 게 안 보인다. 세션이 붙으면 `getViewer()`가 쿠키를 읽어 저절로 동적이 되지만,
     목인 지금은 동적 신호가 없어 `○`(Static)으로 빌드된다 — 그때 지워도 되는 줄이다.
*/
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "기업 설정",
};

/**
 * 기업 설정 — 사업자 정보와 **조직 체계**를 고친다.
 *
 * ⚠️ **OWNER 전용**이다(§라우트 그룹). Admin 겸직으로는 안 연다 —
 *    직급의 권한이 여기서 나와서, 열어주면 자기 위를 스스로 만들 수 있다.
 *    화면 가드는 UX일 뿐이고 **각 저장 액션이 `canManageCompany`로 서버에서 다시 본다**(§권한).
 * ⚠️ 탭으로 나누지 않는다. 세 덩이뿐이라 한 화면에 쌓아도 읽히고,
 *    탭은 **무엇이 있는지 감추기만** 한다.
 * ⚠️ 폭은 720이다 — 좌 네비 없는 폼 한 장(DESIGN §4). 항목이 늘어 좌 네비가 생기는 날 960이다.
 * ⚠️ 편집 조각은 온보딩 것을 그대로 쓴다 — 두 벌이면 한쪽만 고쳐지고 조작이 갈린다.
 */
export default async function OwnerSettingPage() {
  const [setting, viewer] = await Promise.all([getCompanySetting(), getViewer()]);

  // 권한이 없으면 "권한 없음"이 아니라 없는 화면으로 둔다 — 있다는 사실 자체를 안 알린다
  if (!canManageCompany(viewer)) notFound();

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-7">
        <CompanyProfileCard profile={setting.profile} />
        <CompanyTeamCard initial={setting.departments} />
        <CompanyPositionCard initial={setting.positions} />
      </div>
    </div>
  );
}
