import { Checkbox } from "@/components/ui/checkbox";
import { ACTION_DELAYED_LABEL, ACTION_STATUS_LABEL, isDelayed } from "@/constants/domain";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { HandoverActionItem } from "../types";

interface HandoverActionListCardProps {
  actions: HandoverActionItem[];
  selectedIds: Set<number>;
  /** 휴직 기간과 마감일이 겹치는 항목 — 숨기지 않고 배지로만 표시(§lib 절충안). */
  highlightedIds?: Set<number>;
  /** 오프보딩 — 전체 선택 고정, 체크박스는 보여주되 못 바꾼다. */
  locked?: boolean;
  onToggle?: (id: number) => void;
}

/**
 * "내 담당 액션" 체크리스트 카드 — 휴직·오프보딩 두 탭이 같이 쓴다.
 * ⚠️ 완료 액션은 여기 오기 전에 이미 걸러졌다(`server.ts`) — 이 컴포넌트는 필터링을
 *    다시 하지 않는다.
 */
export function HandoverActionListCard({
  actions,
  selectedIds,
  highlightedIds,
  locked,
  onToggle,
}: HandoverActionListCardProps) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />내 담당 액션
        </h2>
        <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
          {selectedIds.size}/{actions.length}건 선택
        </p>
      </div>

      {actions.length === 0 ? (
        <p className="text-muted-foreground border-border border-t px-7 py-8 text-center text-[13px] leading-5">
          완료하지 않은 담당 액션이 없습니다.
        </p>
      ) : (
        <ul className="border-border border-t">
          {actions.map((action) => {
            const checked = selectedIds.has(action.id);
            const tagColor = pickPaletteColor(action.projectTag);
            const delayed = isDelayed(action);

            return (
              <li
                key={action.id}
                className="border-border flex items-center gap-3 border-b px-7 py-3 last:border-b-0"
              >
                <Checkbox
                  checked={checked}
                  disabled={locked}
                  onCheckedChange={() => onToggle?.(action.id)}
                  aria-label={`${action.title} 인수인계 대상 선택`}
                />
                <span
                  className="w-fit shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                  style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
                >
                  {action.projectTag}
                </span>
                <span className="text-muted-foreground hidden w-[120px] shrink-0 truncate text-[12px] leading-4 sm:inline">
                  {action.parentTeamActionName}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
                  {action.title}
                </span>
                {highlightedIds?.has(action.id) && (
                  <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 text-[10px] leading-4">
                    기간 중 마감
                  </span>
                )}
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
