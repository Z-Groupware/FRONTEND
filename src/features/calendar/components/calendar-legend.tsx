const LEGEND_ITEMS = [
  { key: "PERSONAL_TODO", label: "Todo", dotColor: "var(--calendar-todo)" },
  { key: "PERSONAL_ACTION", label: "개인 액션", dotColor: "var(--calendar-action)" },
] as const;

/** 캘린더 상단 툴바 오른쪽 끝에 붙는 색상 범례. */
export function CalendarLegend() {
  return (
    <ul className="flex items-center gap-4">
      {LEGEND_ITEMS.map((item) => (
        <li key={item.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: item.dotColor }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
