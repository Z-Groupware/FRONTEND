import type { Metadata } from "next";

import { HANDOVER_TYPE } from "@/constants/domain";
import { HandoverControls } from "@/features/handover/components/handover-controls";
import { OffboardingForm } from "@/features/handover/components/offboarding-form";
import { VacationForm } from "@/features/handover/components/vacation-form";
import { parseHandoverPreview, parseHandoverType } from "@/features/handover/lib";
import { getHandoverContext } from "@/features/handover/server";

export const metadata: Metadata = {
  title: "인수인계서",
};

interface HandoverPageProps {
  searchParams: Promise<{ as?: string; type?: string }>;
}

/**
 * 인수인계서 신청 — 휴직/오프보딩(WORKFLOW.md §7).
 * ⚠️ Owner는 이 화면에 안 온다(`canWriteHandover`) — 지금은 로그인 세션이 없어 실제 가드
 *    대신 미리보기 토글로 인물을 바꾼다(`HandoverControls` 주석 참고).
 */
export default async function HandoverPage({ searchParams }: HandoverPageProps) {
  const params = await searchParams;
  const preview = parseHandoverPreview(params.as);
  const type = parseHandoverType(params.type);
  const context = await getHandoverContext(preview);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
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
