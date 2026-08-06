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
 * ⚠️ 폭은 **1440**이다 — 저장소 관리·구독과 같은 전폭 카드다(DESIGN §4 목록·표).
 *    720(폼 한 장)으로 두면 사이드바로 오갈 때 이 화면만 본문이 좁아져 튄다.
 *    대신 기본 정보의 입력칸은 카드 안에서 3열로 나눈다 — 표는 넓을수록 좋지만 입력칸은 아니다.
 * ⚠️ 편집 조각은 온보딩 것을 그대로 쓴다 — 두 벌이면 한쪽만 고쳐지고 조작이 갈린다.
 */
export default async function OwnerSettingPage() {
  const [setting, viewer] = await Promise.all([getCompanySetting(), getViewer()]);

  // 권한이 없으면 "권한 없음"이 아니라 없는 화면으로 둔다 — 있다는 사실 자체를 안 알린다
  if (!canManageCompany(viewer)) notFound();

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        <CompanyProfileCard profile={setting.profile} />

        {/*
          ⚠️ 조직 카드 둘은 **나란히** 둔다. 트리도 직급도 보여 줄 게 `이름`과 `구분` 둘뿐이라,
             1440 한 줄을 통째로 주면 이름은 왼쪽 끝, 뱃지는 오른쪽 끝에 붙고 가운데가 텅 빈다
             (저장소 표는 열이 여섯이라 채워지는 것이고, 열 둘짜리 목록은 그렇지 않다).
          ⚠️ 성격도 같다 — 둘 다 온보딩에서 만든 조직 체계를 나중에 고치는 자리다.
        */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <CompanyTeamCard initial={setting.departments} />
          <CompanyPositionCard initial={setting.positions} />
        </div>
      </div>
    </div>
  );
}
