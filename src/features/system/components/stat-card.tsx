import { cn } from "@/lib/utils";

/**
 * 값 강조 색 — **핵심 지표와 경고성 지표를 구분**한다. 전부 같은 색으로 강조하면
 * "MRR"(잘 되고 있다는 핵심 수치)과 "미납"(조치가 필요하다는 경고)이 똑같이 읽혀
 * 어느 쪽에 먼저 시선을 둬야 할지 알 수 없다.
 */
export type StatCardTone = "neutral" | "accent" | "warning" | "danger";

const VALUE_TONE: Record<StatCardTone, string> = {
  neutral: "text-foreground",
  accent: "text-chart-1",
  warning: "text-warning",
  danger: "text-destructive",
};

interface StatCardProps {
  label: string;
  value: string;
  meta: string;
  tone?: StatCardTone;
}

/** 대시보드·구독매출 상단 통계 한 칸. */
export function StatCard({ label, value, meta, tone = "neutral" }: StatCardProps) {
  return (
    <div className="border-border bg-card flex flex-col gap-1.5 rounded-xl border p-4">
      <p className="text-muted-foreground text-xs leading-4">{label}</p>
      <p className={cn("text-xl leading-7 font-semibold tabular-nums", VALUE_TONE[tone])}>
        {value}
      </p>
      <p className="text-muted-foreground/70 text-[11px] leading-4">{meta}</p>
    </div>
  );
}
