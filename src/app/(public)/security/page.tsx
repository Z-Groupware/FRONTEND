import type { Metadata } from "next";

import { DocPage, DocSection } from "@/features/landing/components/doc-page";

export const metadata: Metadata = { title: "보안 — Z" };

/**
 * ⚠️ **지금 구현된 것만 적는다.** 아직 안 붙은 걸 적으면 그게 거짓말이 된다(§정직성).
 *    인증·BFF가 붙으면 이 문서도 같이 갱신한다.
 */
export default function SecurityPage() {
  return (
    <DocPage title="보안" description="회사 기록을 다루는 도구라 지키기로 한 것들입니다.">
      <DocSection title="로그인 정보">
        <p>
          인증 토큰은 브라우저 자바스크립트가 읽을 수 없는 쿠키(httpOnly)에 둡니다. `localStorage`에
          토큰을 저장하지 않습니다.
        </p>
      </DocSection>

      <DocSection title="회사 간 분리">
        <p>
          어느 회사의 데이터인지는 주소가 아니라 로그인 세션이 정합니다. 주소창 값을 고쳐도 다른
          회사의 자료에 닿을 수 없습니다.
        </p>
      </DocSection>

      <DocSection title="권한 확인">
        <p>
          화면에서 버튼을 숨기는 것은 보기 편하라고 하는 일일 뿐입니다. 실제 권한은 요청이 올 때마다
          서버가 다시 확인합니다.
        </p>
      </DocSection>

      <DocSection title="결제">
        <p>
          카드 정보는 Toss Payments가 직접 받습니다. Z의 화면에는 카드번호를 입력하는 칸이 아예
          없습니다.
        </p>
      </DocSection>

      <DocSection title="아직 준비 중">
        <p>
          외부 보안 감사와 접근 기록(감사 로그)은 아직 준비 중입니다. 준비되면 이 문서에 적겠습니다.
        </p>
      </DocSection>
    </DocPage>
  );
}
