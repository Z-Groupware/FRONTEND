import { cn } from "@/lib/utils";

import { CALENDAR_ITEM_TAG, CALENDAR_ITEM_TAG_LABEL, type PersonalCalendarEvent } from "../types";

/** 태그별 기본 점 색 — 항목에 `color`가 없을 때만 쓴다(`personal-calendar.tsx`의 `TAG_SURFACE`와 같은 값). */
const DOT_COLOR: Record<PersonalCalendarEvent["tag"], string> = {
  [CALENDAR_ITEM_TAG.PERSONAL_TODO]: "var(--calendar-todo)",
  [CALENDAR_ITEM_TAG.PERSONAL_ACTION]: "var(--calendar-action)",
};

interface CalendarEventListItemProps {
  event: PersonalCalendarEvent;
}

/** 날짜 상세조회 패널의 리스트 한 줄. 다른 목록(예: 주간 회의실 뷰)에서도 재사용할 수 있게 분리해뒀다. */
export function CalendarEventListItem({ event }: CalendarEventListItemProps) {
  return (
    <li className="border-border bg-card flex items-start gap-2 rounded-lg border p-3">
      <span
        aria-hidden
        className="mt-1 size-2 shrink-0 rounded-full"
        style={{ backgroundColor: event.color ?? DOT_COLOR[event.tag] }}
      />
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
