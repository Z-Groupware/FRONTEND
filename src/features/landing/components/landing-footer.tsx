import Link from "next/link";

import { ZLogo } from "@/components/icons/z-logo";

/**
 * 푸터.
 *
 * ⚠️ 약관·개인정보·보안·역할 안내는 **각각 독립된 주소**를 갖는다.
 *    랜딩 안에서 스크롤로 넘기지 않는다 — 주소를 공유하거나 북마크할 수 있어야 하고,
 *    약관은 법적으로도 따로 가리킬 수 있어야 한다.
 * ⚠️ 아직 없는 화면은 `href`를 `null`로 둔다. 만들면 주소만 채우면 링크가 된다.
 */
const COLUMNS = [
  {
    title: "제품",
    items: [
      { label: "요금제", href: "/pricing" },
      { label: "역할별 권한", href: "/roles" },
      { label: "로드맵", href: null },
    ],
  },
  {
    title: "회사",
    items: [
      { label: "소개", href: null },
      { label: "블로그", href: null },
      { label: "채용", href: null },
    ],
  },
  {
    title: "법적 고지",
    items: [
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
      { label: "보안", href: "/security" },
    ],
  },
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
              {column.items.map((item) =>
                item.href ? (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={item.label}>
                    {/* ⚠️ 아직 없는 화면은 링크로 두지 않는다 — 누르면 404가 뜬다(§정직성) */}
                    <span
                      aria-disabled
                      title="아직 만드는 중이에요"
                      className="text-muted-foreground/50 cursor-not-allowed text-[13px] leading-5"
                    >
                      {item.label}
                    </span>
                  </li>
                ),
              )}
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
