import { Check } from "lucide-react";
import type { Metadata } from "next";

import { ZLogo } from "@/components/icons/z-logo";
import { StepCircle } from "@/features/onboarding/components/step-circle";

export const metadata: Metadata = {
  title: "초기 설정 완료 — Z",
};

/**
 * ⚠️ **임시 화면** — 3단계의 [완료]·[나중에 하기]가 갈 곳이 필요해서 최소한만 둔다.
 *    완료 화면 시안이 나오면 이 파일을 통째로 교체한다.
 *    대시보드(`/owner`)가 아직 없어서 이동 버튼도 두지 않았다(정직성: 안 되는 걸 되는 척하지 않는다).
 */
export default function OnboardingDonePage() {
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px] px-6 text-center">
      <ZLogo className="text-foreground size-6" title="Z" />

      <StepCircle tone="done" size={44}>
        <Check className="size-5" />
      </StepCircle>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl leading-[25px] font-semibold tracking-[-0.4px]">
          초기 설정을 마쳤어요
        </h1>
        <p className="text-muted-foreground max-w-[420px] text-[13px] leading-[21px]">
          부서·직급 체계와 초대 목록을 담아 뒀어요. ⚠️ 초대 메일은 아직 나가지 않습니다 — 서버 연동
          후에 실제로 발송됩니다.
        </p>
      </div>

      <p className="text-muted-foreground/60 border-border rounded-md border border-dashed px-3 py-2 text-[11px] leading-4">
        완료 화면과 대시보드는 아직 만드는 중이에요 — 디자인 확정 후 이어집니다
      </p>
    </main>
  );
}
