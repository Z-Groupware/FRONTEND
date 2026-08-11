import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface TaskGroupSectionProps {
  icon: LucideIcon;
  title: string;
  count: number;
  emptyMessage: string;
  children: ReactNode;
}

/**
 * 마이페이지 "처리할 일" 탭의 그룹 카드 — 회의 관련 두 그룹("미확정 액션"·"요약이
 * 중단된 회의")이 같은 모양을 쓴다(`features/meeting/review/action-review-group.tsx`와
 * 같은 결 — 카드 헤더에 아이콘+제목+건수, 없으면 빈 문구).
 */
export function TaskGroupSection({
  icon: Icon,
  title,
  count,
  emptyMessage,
  children,
}: TaskGroupSectionProps) {
  return (
    <section className="border-border bg-card rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <Icon className="text-foreground size-4" aria-hidden />
          {title}
        </h2>
        <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">{count}건</p>
      </div>
      {count === 0 ? (
        <p className="text-muted-foreground px-7 pt-1 pb-6 text-[13px] leading-5">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col">{children}</div>
      )}
    </section>
  );
}
