import type { Metadata } from "next";

import { DocPage, DocSection } from "@/features/landing/components/doc-page";

export const metadata: Metadata = { title: "개인정보처리방침 — Z" };

/** ⚠️ **초안이다.** 법무 검토 전이며, 실제 수집 항목은 ERD·API 확정 후 다시 맞춘다. */
export default function PrivacyPage() {
  return (
    <DocPage title="개인정보처리방침" description="어떤 정보를 왜 다루는지 적어 둡니다.">
      <p className="border-border bg-secondary text-muted-foreground mb-8 rounded-lg border px-4 py-3 text-[13px] leading-[21px] break-keep">
        ⚠️ 아직 법무 검토를 받지 않은 초안입니다. 수집 항목도 확정 전이라 바뀔 수 있습니다.
      </p>

      <DocSection title="1. 다루는 정보">
        <p>이름, 회사 이메일, 소속 부서와 역할, 직급. 계정 발급 시 회사가 입력한 정보입니다.</p>
        <p>회의 녹음 파일과 자막, 액션 내용. 서비스를 쓰는 과정에서 생기는 기록입니다.</p>
      </DocSection>

      <DocSection title="2. 쓰는 목적">
        <p>
          회의 기록을 정리해 담당자에게 할 일을 전달하고, 인수인계 문서를 구성하기 위해 씁니다. 그
          밖의 목적으로 쓰지 않습니다.
        </p>
      </DocSection>

      <DocSection title="3. 보관과 삭제">
        <p>
          기록은 회사가 구독을 유지하는 동안 보관됩니다. 회사가 프로젝트를 삭제하면 그에 속한 녹음도
          함께 삭제됩니다.
        </p>
      </DocSection>

      <DocSection title="4. 결제 정보">
        <p>
          카드 정보는 <strong className="text-foreground">Z가 받지 않습니다.</strong> 결제는 Toss
          Payments가 처리하며, 카드번호는 우리 서버에 저장되지 않습니다.
        </p>
      </DocSection>
    </DocPage>
  );
}
