import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 검색 화면의 한 덩이 — **레포 표준 카드 머리**(표식 + 17px 제목)를 쓴다.
 *
 * ⚠️ 이 화면만 제목을 **12px 회색 글자**로 띄워 두고 있었다. 레포의 다른 서른한 곳은
 *    전부 `표식 + 17px`인데 여기만 달라서, 같은 앱인데 이 화면만 **덜 만든 것처럼** 보였다 —
 *    "밋밋하다"의 정체가 장식이 모자란 게 아니라 **규격을 안 쓴 것**이었다.
 * ⚠️ 표식은 **먹색 한 점**이다(§DESIGN 5: 색은 정해진 자리만). 여기에 색을 넣으면
 *    프로젝트 태그·상태점과 뜻이 겹친다.
 * ⚠️ 오른쪽 `meta`는 개수처럼 **한 번만 말하면 되는 값**을 둔다 — 제목과 같은 줄 반대편에
 *    두면 눈이 한 줄에서 둘을 같이 읽는다.
 */

interface SearchSectionProps {
  title: string;
  /** 제목 반대편에 서는 작은 값(개수 등) */
  meta?: ReactNode;
  children: ReactNode;
  /**
   * 안쪽에 여백을 줄지.
   * ⚠️ 목록처럼 **줄이 카드 끝까지 닿아야 하는 것**은 `false`다 — 여백을 주면 구분선이
   *    가운데만 그어져 표가 아니라 문단으로 보인다.
   */
  padded?: boolean;
  /**
   * 안쪽 여백을 좁힐지.
   * ⚠️ 한 줄짜리 내용(칩 한 줄)에 기본 여백을 주면 **테두리가 내용보다 커진다** — 카드가
   *    내용을 담는 게 아니라 빈 자리를 담게 된다.
   */
  compact?: boolean;
  className?: string;
}

export function SearchSection({
  title,
  meta,
  children,
  padded = true,
  compact = false,
  className,
}: SearchSectionProps) {
  return (
    <section
      className={cn(
        "border-border bg-card flex flex-col overflow-hidden rounded-2xl border",
        className,
      )}
    >
      {/* 규격은 대시보드 카드와 같다 — 같은 것이 화면마다 다르면 안 된다 */}
      <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-5 pb-4">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          {title}
        </h2>
        {meta && (
          <span className="text-muted-foreground shrink-0 text-[12px] leading-4 tabular-nums">
            {meta}
          </span>
        )}
      </div>

      <div className={cn(padded && (compact ? "px-7 py-4" : "px-7 py-6"))}>{children}</div>
    </section>
  );
}
