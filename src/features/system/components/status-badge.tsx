import { cn } from "@/lib/utils";

/**
 * SYSTEM 화면 전용 상태 색 — **긍정/경고/위험을 색으로 구분**한다(기업 관리·기업 승인·구독 매출
 * 표가 전부 이 색을 쓴다). `Badge` 컴포넌트의 `variant`(`default`/`secondary`/`destructive`)만으로는
 * 셋 다 표현이 안 돼서(전부 액센트 블루 아니면 회색으로만 나뉜다) `role-badge.tsx`처럼 raw span +
 * 시맨틱 토큰 조합으로 만든다. 값은 `globals.css`의 `--success`/`--warning`/`--destructive`라
 * 다크모드가 그대로 따라온다.
 */
export const STATUS_TONE = {
  positive: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  negative: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
} as const;

export type StatusTone = keyof typeof STATUS_TONE;

interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap",
        STATUS_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
