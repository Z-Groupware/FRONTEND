import Link from "next/link";

import { ZLogo } from "@/components/icons/z-logo";

/**
 * 푸터.
 * ⚠️ 아직 없는 화면은 링크로 두지 않는다 — 누르면 404가 뜬다(§정직성).
 *    만들면 `href`를 채워 링크로 바꾼다.
 */
const COLUMNS = [
  { title: "제품", items: ["기능 소개", "요금제", "로드맵"] },
  { title: "회사", items: ["소개", "블로그", "채용"] },
  { title: "법적 고지", items: ["이용약관", "개인정보처리방침", "보안"] },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-border border-t py-12">
      <div className="mx-auto grid w-full max-w-[1144px] gap-10 px-7 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" aria-label="Z 홈" className="flex items-center gap-[7px]">
            <ZLogo className="text-foreground size-[18px]" title="Z" />
            <span className="translate-y-px text-base leading-6 font-semibold tracking-[-0.4px]">
              Z
            </span>
          </Link>
          <p className="text-muted-foreground max-w-[200px] pt-2.5 text-[13px] leading-[21px] break-keep">
            회의를 하면, 조직의 기억이 된다
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-[12px] leading-[18px] font-semibold tracking-[1.2px] uppercase">
              {column.title}
            </p>
            <ul className="flex flex-col gap-[7px] pt-2.5">
              {column.items.map((item) => (
                <li key={item}>
                  {/* ⚠️ 아직 없는 화면은 링크로 두지 않는다 — 누르면 404가 뜬다(§정직성) */}
                  <span
                    aria-disabled
                    title="아직 만드는 중이에요"
                    className="text-muted-foreground cursor-not-allowed text-[13px] leading-5"
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto w-full max-w-[1144px] px-7">
        <p className="border-border text-muted-foreground/70 mt-9 border-t pt-5 text-[12px] leading-[18px]">
          © 2026 Z. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
