import type { Metadata } from "next";

import { DocPage, DocSection } from "@/features/landing/components/doc-page";

export const metadata: Metadata = { title: "이용약관 — Z" };

/**
 * ⚠️ **초안이다.** 법무 검토를 받지 않았다 — 서비스를 열기 전에 반드시 확정본으로 교체한다.
 *    지금은 화면 자리와 흐름만 잡아 둔 상태이고, 그 사실을 화면에도 적는다(§정직성).
 */
export default function TermsPage() {
  return (
    <DocPage title="이용약관" description="Z를 쓰실 때 적용되는 약속입니다.">
      <p className="border-border bg-secondary text-muted-foreground mb-8 rounded-lg border px-4 py-3 text-[13px] leading-[21px] break-keep">
        ⚠️ 아직 법무 검토를 받지 않은 초안입니다. 정식 출시 전에 확정본으로 교체됩니다.
      </p>

      <DocSection title="1. 서비스 소개">
        <p>
          Z는 회의 내용을 기록하고, 결정과 할 일을 담당자에게 배정하는 사내 협업 도구입니다. 회사가
          계정을 발급하며, 한 계정은 하나의 회사에 속합니다.
        </p>
      </DocSection>

      <DocSection title="2. 계정">
        <p>
          계정은 회사의 관리자가 발급합니다. 발급받은 계정 정보를 다른 사람과 공유할 수 없습니다.
          비밀번호를 잃어버린 경우 관리자에게 재발급을 요청해 주세요.
        </p>
      </DocSection>

      <DocSection title="3. 회의 기록">
        <p>
          회의 녹음과 자막은 회의를 개설한 사람이 시작합니다. 기록은 회사에 귀속되며, 담당자가
          바뀌어도 회사 안에 남습니다.
        </p>
        <p>회의에 참여하는 모든 분께 기록이 남는다는 사실을 미리 알려 주세요.</p>
      </DocSection>

      <DocSection title="4. 구독과 결제">
        <p>
          유료 플랜은 구성원 수를 기준으로 매월 또는 매년 청구됩니다. 언제든지 해지할 수 있고,
          해지하면 다음 결제부터 청구되지 않습니다.
        </p>
      </DocSection>

      <DocSection title="5. 문의">
        <p>약관에 관한 문의는 회사의 관리자를 통해 전달해 주세요.</p>
      </DocSection>
    </DocPage>
  );
}
