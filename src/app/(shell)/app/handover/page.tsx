import type { Metadata } from "next";

import { AccessDenied } from "@/components/common/access-denied";
import { HANDOVER_TYPE } from "@/constants/domain";
import { HandoverControls } from "@/features/handover/components/handover-controls";
import { OffboardingForm } from "@/features/handover/components/offboarding-form";
import { VacationForm } from "@/features/handover/components/vacation-form";
import { parseHandoverPreview, parseHandoverType } from "@/features/handover/lib";
import { getHandoverContext } from "@/features/handover/server";
import { roleHome } from "@/features/shell/home";
import { getViewer } from "@/features/shell/viewer";
import { canWriteHandover } from "@/lib/permission";

export const metadata: Metadata = {
  title: "인수인계서",
};

interface HandoverPageProps {
  searchParams: Promise<{ as?: string; type?: string }>;
}

/**
 * 인수인계서 신청 — 휴직/오프보딩(WORKFLOW.md §7).
 * ⚠️ Owner는 이 화면에 안 온다 — `canWriteHandover`로 실제 가드를 건다(2026-08-15,
 *    "로그인 세션이 없어 미리보기 토글로 대신한다"던 이전 상태를 벗어남).
 *    미리보기 토글(`?as=`)은 mock 모드에서만 의미가 있고, 실서버에서는
 *    `getHandoverContext`가 그 값을 무시하고 실제 로그인 세션(`getViewer`)만 본다.
 */
export default async function HandoverPage({ searchParams }: HandoverPageProps) {
  const viewer = await getViewer();
  if (!canWriteHandover(viewer)) {
    return <AccessDenied homeHref={roleHome(viewer.role)} />;
  }

  const params = await searchParams;
  const preview = parseHandoverPreview(params.as);
  const type = parseHandoverType(params.type);
  const context = await getHandoverContext(preview);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      {/*
        ⚠️ **1440이다**(2026-08-11). 720은 **단일 폼 한 장**의 폭인데, 이 화면의 몸통은
           `내 담당 액션` 표(체크박스·프로젝트·액션·상태·마감)라 폼이 아니라 목록에 가깝다 —
           승인 쪽 같은 화면(`/team/handover/:id`)도 1440이라 폭이 갈려 있었다.
        ⚠️ 대신 **입력칸에는 따로 상한을 건다**(각 폼 안에서). 카드가 넓어졌다고 날짜 칸까지
           1400px로 늘리면 라벨과 커서가 멀어져 읽고 쓰기가 나빠진다(기업 설정과 같은 판단).
      */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <HandoverControls activePreview={preview} activeType={type} />

        {type === HANDOVER_TYPE.VACATION ? (
          <VacationForm context={context} />
        ) : (
          <OffboardingForm context={context} />
        )}
      </div>
    </main>
  );
}
