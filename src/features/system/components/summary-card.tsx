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
 * ⚠️ 칸은 세로선(`lg:border-l`)으로만 가른다. 카드 안에 카드(개별 mini-card)를 얹지 않는다.
 * ⚠️ 값 강조는 색이 아니라 명도다 — `accent`/`warning`/`danger` 같은 톤을 따로 두지 않는다(§5).
 * ⚠️ **큰 숫자는 30px다**(DESIGN §4). 한때 20px이었는데, 카드 안쪽이 `p-7`이라 숫자만 작고
 *    위아래가 휑해서 "요약"이 아니라 빈 띠로 읽혔다 — 이 카드에서 제일 먼저 읽혀야 하는 게 값이다.
 */
export function SummaryCard({ items }: SummaryCardProps) {
  return (
    <section className="border-border bg-card rounded-2xl border px-7 py-6">
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
              "flex flex-col items-center gap-1 text-center lg:px-6",
              index > 0 && "border-border lg:border-l",
            )}
          >
            <p className="text-muted-foreground text-[12px] leading-4">{item.label}</p>
            <p className="text-[30px] leading-9 font-semibold tracking-[-0.8px] tabular-nums">
              {item.value}
            </p>
            <p className="text-muted-foreground/70 text-[11px] leading-4">{item.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
