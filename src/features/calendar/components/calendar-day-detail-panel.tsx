import { format } from "date-fns";
import { ko } from "date-fns/locale";

import type { PersonalCalendarEvent } from "../types";
import { CalendarEventListItem } from "./calendar-event-list-item";

interface CalendarDayDetailPanelProps {
  selectedDate: Date;
  /** 이미 그 날짜로 걸러진 목록 — 필터링은 `calendar-board.tsx`가 한다. */
  events: PersonalCalendarEvent[];
  /** PERSONAL_TODO 완료 토글 — `calendar-event-list-item.tsx`로 그대로 흘려보낸다. */
  onToggleCompletion?: (id: string) => void;
}

/** 캘린더 오른쪽에 고정으로 붙는 날짜 상세조회 패널. 셀 클릭마다 `calendar-board.tsx`가 이 props를 갈아 끼운다. */
export function CalendarDayDetailPanel({
  selectedDate,
  events,
  onToggleCompletion,
}: CalendarDayDetailPanelProps) {
  return (
    <aside className="border-border flex h-full w-full max-w-[230px] shrink-0 flex-col border-l pl-6 lg:w-[230px]">
      <div className="flex items-baseline justify-between gap-2 pb-4">
        <h2 className="text-base font-semibold">
          {format(selectedDate, "yyyy년 M월 d일(EEE)", { locale: ko })}
        </h2>
        <span className="text-muted-foreground shrink-0 text-xs">{events.length}건</span>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground flex flex-1 items-center justify-center text-center text-sm">
          이 날짜에 일정이 없습니다
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {events.map((event) => (
            <CalendarEventListItem
              key={event.id}
              event={event}
              onToggleCompletion={onToggleCompletion}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}
