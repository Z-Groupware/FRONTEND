import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  meta: string;
  /** 눈에 띄어야 할 수치 — 차트와 같은 강조색을 써서 한 화면 안에서 시선을 통일한다 */
  isHighlighted?: boolean;
}

/** 대시보드 상단 통계 한 칸. */
export function StatCard({ label, value, meta, isHighlighted }: StatCardProps) {
  return (
    <div className="border-border bg-card flex flex-col gap-2 rounded-xl border p-5">
      <p className="text-muted-foreground text-[13px] leading-[18px]">{label}</p>
      <p
        className={cn(
          "text-2xl leading-8 font-semibold tabular-nums",
          isHighlighted ? "text-chart-1" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-muted-foreground/70 text-xs leading-4">{meta}</p>
    </div>
  );
}
