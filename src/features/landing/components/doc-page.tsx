import type { ReactNode } from "react";

import { LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";

/**
 * 로그인 전 설명 문서 한 장(약관·개인정보·보안·역할 안내).
 *
 * ⚠️ 랜딩 안에서 스크롤로 넘기지 않고 **각각 독립된 주소**를 갖는다.
 *    주소를 공유하거나 북마크할 수 있어야 하고, 약관은 법적으로도 따로 가리킬 수 있어야 한다.
 */
export function DocPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <LandingHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[760px] px-7 py-16 lg:py-20">
          <h1 className="text-[32px] leading-[40px] font-semibold tracking-[-0.7px] break-keep lg:text-[36px] lg:leading-[44px]">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground pt-3 text-[15px] leading-[26px] break-keep">
              {description}
            </p>
          )}

          <div className="pt-10">{children}</div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

/** 문서 안의 한 절 — 제목과 본문 문단들. */
export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-border border-t py-8 first:border-t-0 first:pt-0">
      <h2 className="text-[17px] leading-[26px] font-semibold">{title}</h2>
      <div className="text-muted-foreground flex flex-col gap-3 pt-3 text-[14px] leading-[24px] break-keep">
        {children}
      </div>
    </section>
  );
}
