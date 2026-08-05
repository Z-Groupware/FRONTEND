import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  /** 강조색 — 없으면 기본 텍스트색 */
  tone?: "danger" | "warning";
}

/** 대시보드 상단 KPI 4카드가 공유하는 한 칸. */
export function KpiCard({ label, value, sub, tone }: KpiCardProps) {
  return (
    <div className="border-border bg-card flex flex-col gap-1.5 rounded-xl border p-4">
      <p className="text-muted-foreground text-xs leading-4">{label}</p>
      <p
        className={cn(
          "text-xl leading-7 font-semibold tabular-nums",
          tone === "danger" && "text-destructive",
          tone === "warning" && "text-warning",
          !tone && "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-muted-foreground/70 text-[11px] leading-4">{sub}</p>
    </div>
  );
}
