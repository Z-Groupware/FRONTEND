import { ACTION_DELAYED_LABEL, ACTION_STATUS_LABEL, isDelayed } from "@/constants/domain";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { LeaderHandoverAction } from "../types";

/** 담긴 액션 전체 — 읽기만 한다(WORKFLOW.md §7). 담당자 변경은 [귀속]이 한 번에 한다. */
export function LeaderHandoverActionList({ actions }: { actions: LeaderHandoverAction[] }) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
          담긴 액션
        </h2>
        <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
          {actions.length}건
        </p>
      </div>

      {actions.length === 0 ? (
        <p className="text-muted-foreground border-border border-t px-7 py-8 text-center text-[13px] leading-5">
          담긴 액션이 없습니다.
        </p>
      ) : (
        <ul className="border-border border-t">
          {actions.map((action) => {
            const tagColor = pickPaletteColor(action.projectTag);
            const delayed = isDelayed(action);
            return (
              <li
                key={action.id}
                className="border-border flex items-center gap-3 border-b px-7 py-3 last:border-b-0"
              >
                <span
                  className="w-fit shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                  style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
                >
                  {action.projectTag}
                </span>
                <span className="text-muted-foreground hidden w-[140px] shrink-0 truncate text-[12px] leading-4 sm:inline">
                  {action.parentTeamActionName}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
                  {action.title}
                </span>
                <span
                  className={cn(
                    "w-[52px] shrink-0 rounded border px-1.5 py-0.5 text-center text-[11px] leading-4",
                    delayed
                      ? "border-destructive/40 text-destructive"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {delayed ? ACTION_DELAYED_LABEL : ACTION_STATUS_LABEL[action.status]}
                </span>
                <time
                  dateTime={action.dueDate}
                  className="text-muted-foreground w-20 shrink-0 text-right text-[12px] leading-4 whitespace-nowrap tabular-nums"
                >
                  {formatMonthDayWeekday(action.dueDate)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
