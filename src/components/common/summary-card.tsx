import { cn } from "@/lib/utils";

interface SummaryItem {
  label: string;
  value: string;
  meta: string;
}

interface SummaryCardProps {
  items: SummaryItem[];
}

/**
 * 페이지 상단 통계 — DESIGN.md "요약 카드: 세 칸 균등" 패턴.
 *
 * ⚠️ **운영자 화면 전용이 아니다**(2026-08-10 `features/system`에서 옮겨 왔다). 오너·팀장
 *    대시보드가 각자 4장짜리 미니 카드(`kpi-card.tsx`)를 두고 있었는데, 그건 §2가 하지 말라는
 *    "카드 안에 카드"였고 값도 20px이라 같은 자리가 화면마다 다르게 보였다 — 한 자리로 모은다.
 * ⚠️ 칸은 세로선(`lg:border-l`)으로만 가른다. 카드 안에 카드(개별 mini-card)를 얹지 않는다.
 * ⚠️ 값 강조는 색이 아니라 명도다 — `accent`/`warning`/`danger` 같은 톤을 따로 두지 않는다(§5).
 */
export function SummaryCard({ items }: SummaryCardProps) {
  return (
    <section className="border-border bg-card rounded-2xl border p-7">
      <div
        className={cn(
          "grid gap-6 lg:items-center lg:gap-0",
          items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        )}
      >
        {items.map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "flex flex-col items-center gap-1.5 text-center lg:px-4",
              index > 0 && "border-border lg:border-l",
            )}
          >
            <p className="text-muted-foreground text-xs leading-4">{item.label}</p>
            <p className="text-xl leading-7 font-semibold tabular-nums">{item.value}</p>
            <p className="text-muted-foreground/70 text-[11px] leading-4">{item.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
