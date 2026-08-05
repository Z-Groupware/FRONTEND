import type { Metadata } from "next";

import { ScreenScaleCard } from "@/features/appearance/components/screen-scale-card";

export const metadata: Metadata = {
  title: "마이페이지",
};

/**
 * 마이페이지 — 지금은 **화면 배율 하나뿐**이다.
 *
 * ⚠️ **명세가 아직 없다.** 라우트 트리에는 `/app/me`가 있지만 `docs/WORKFLOW.md`에 화면
 *    내용이 없다 — 프로필·알림·비밀번호 같은 걸 지금 지어내면 명세가 나올 때 갈아엎어야 한다.
 *    배율만 먼저 두고 그 위에 얹는다(§명세에 없는 화면·기능은 안 만든다).
 * ⚠️ 배율은 **기기 설정**이라 서버에 저장하지 않는다. 여기서는 조회할 것도 없어서
 *    Server Component가 하는 일이 없다.
 */
export default function AppMePage() {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[720px]">
        <ScreenScaleCard />
      </div>
    </div>
  );
}
