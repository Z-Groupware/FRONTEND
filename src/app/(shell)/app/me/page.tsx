import type { Metadata } from "next";

import { ScreenScaleCard } from "@/features/appearance/components/screen-scale-card";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileInfoCard } from "@/features/profile/components/profile-info-card";
import { getMyProfile } from "@/features/profile/server";

export const metadata: Metadata = {
  title: "마이페이지",
};

/**
 * 마이페이지 — 프로필(읽기 전용)과 화면 배율.
 *
 * ⚠️ **편집·연차 등은 명세가 없어 만들지 않는다**(§명세에 없는 화면·기능은 안 만든다).
 *    "기본 정보"는 팀 디자인(피그마)을 그대로 반영했지만, 이 화면에서 값을 고칠 수 있다는
 *    뜻은 아니다 — 편집 API·정책이 확정되면 그때 붙인다.
 * ⚠️ 배율은 **기기 설정**이라 서버에 저장하지 않는다(`ScreenScaleCard` 그대로 유지).
 */
export default async function AppMePage() {
  const profile = await getMyProfile();

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mx-auto flex w-full max-w-[600px] flex-col gap-7">
          <div className="flex flex-col gap-5">
            <ProfileHeader profile={profile} />
            <ProfileInfoCard profile={profile} />
          </div>

          <ScreenScaleCard />
        </div>
      </div>
    </div>
  );
}
