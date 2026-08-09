import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SystemCardHeadingProps {
  /** 카드가 무엇을 담는지 알리는 표식 — `lucide-react` 표준(CLAUDE.md §디자인 토큰) */
  icon: LucideIcon;
  children: ReactNode;
}

/**
 * 시스템(운영자) 카드의 제목 줄.
 *
 * ⚠️ **여덟 곳에 같은 문자열이 복사돼 있었다.** 규격(`px-7 pt-6 pb-3`·17px)이 한 벌이라
 *    한 곳이 어긋나면 카드마다 제목 높이가 달라진다 — 한 자리로 모은다.
 * ⚠️ 표식이 **먹색 점**이었다. 카드마다 같은 점이라 아무것도 안 알리고, 화면 전체가
 *    제목만 여덟 줄 늘어선 것처럼 읽혔다. 카드 주제를 가리키는 아이콘으로 바꾼다 —
 *    색을 더하지 않고도(§디자인 토큰: 색으로 알리는 건 에러뿐) 카드가 구분된다.
 * ⚠️ 아이콘 옆 한글은 **1px 내린다** — 라틴 글자 기준으로 맞춘 아이콘과 한글의 시각 중심이
 *    어긋나 한글만 위로 떠 보인다.
 */
export function SystemCardHeading({ icon: Icon, children }: SystemCardHeadingProps) {
  return (
    <h2 className="flex items-center gap-2 px-7 pt-6 pb-3 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <span className="translate-y-px">{children}</span>
    </h2>
  );
}
