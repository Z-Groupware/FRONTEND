import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { CALENDAR_TAG_DOT_COLOR } from "../tag-colors";
import { CALENDAR_ITEM_TAG, CALENDAR_ITEM_TAG_LABEL, type PersonalCalendarEvent } from "../types";

interface CalendarEventListItemProps {
  event: PersonalCalendarEvent;
  /**
   * 완료 토글 — PERSONAL_TODO에서만 쓴다. PERSONAL_ACTION은 완료 처리 화면이 따로 있어서
   * 여기서는 표시만 하고 체크박스를 안 준다(`calendar-board.tsx` 참고).
   */
  onToggleCompletion?: (id: string) => void;
}

/** 날짜 상세조회 패널의 리스트 한 줄. 다른 목록(예: 주간 회의실 뷰)에서도 재사용할 수 있게 분리해뒀다. */
export function CalendarEventListItem({ event, onToggleCompletion }: CalendarEventListItemProps) {
  const isTodo = event.tag === CALENDAR_ITEM_TAG.PERSONAL_TODO;

  return (
    <li className="border-border bg-card flex items-start gap-2 rounded-lg border p-3">
      {isTodo ? (
        <Checkbox
          checked={event.isCompleted}
          onCheckedChange={() => onToggleCompletion?.(event.id)}
          aria-label={`${event.title} 완료 처리`}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className="mt-1 size-2 shrink-0 rounded-full"
          style={{ backgroundColor: event.color ?? CALENDAR_TAG_DOT_COLOR[event.tag] }}
        />
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <p
          className={cn(
            "truncate text-sm font-medium",
            event.isCompleted && "text-muted-foreground line-through",
          )}
        >
          {event.title}
        </p>
        <p className="text-muted-foreground text-xs">{CALENDAR_ITEM_TAG_LABEL[event.tag]}</p>
      </div>
    </li>
  );
}
