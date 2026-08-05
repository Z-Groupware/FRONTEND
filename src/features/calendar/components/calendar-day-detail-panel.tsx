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

/**
 * 캘린더 오른쪽에 고정으로 붙는 날짜 상세조회 패널. 셀 클릭마다 `calendar-board.tsx`가 이 props를 갈아 끼운다.
 * ⚠️ `lg` 미만에서는 캘린더 아래로 쌓인다(`calendar-board.tsx`) — 그때는 왼쪽 경계선 대신
 *    위쪽 경계선을 쓰고, 고정 높이 대신 최소 높이만 준다.
 */
export function CalendarDayDetailPanel({
  selectedDate,
  events,
  onToggleCompletion,
}: CalendarDayDetailPanelProps) {
  return (
    <aside className="border-border flex min-h-[240px] w-full max-w-[230px] shrink-0 flex-col border-t pt-6 lg:h-full lg:min-h-0 lg:w-[230px] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
      <div className="flex items-baseline justify-between gap-2 pb-4">
        <h2 className="text-base font-semibold">
          {format(selectedDate, "yyyy년 M월 d일(EEE)", { locale: ko })}
        </h2>
        <span className="text-muted-foreground shrink-0 text-xs">{events.length}건</span>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground flex flex-1 items-center justify-center text-center text-sm">
          이 날짜엔 일정이 없어요
        </p>
      ) : (
        // ⚠️ 사이트 전역 규칙(globals.css)이 스크롤바를 감춘다 — 여기는 대신 아래쪽에
        //    옅은 그라데이션을 얹어 "더 있을 수 있다"는 신호를 남긴다(막대 대신 갚는 방식).
        <div className="relative min-h-0 flex-1">
          <ul className="flex h-full flex-col gap-2 overflow-y-auto">
            {events.map((event) => (
              <CalendarEventListItem
                key={event.id}
                event={event}
                onToggleCompletion={onToggleCompletion}
              />
            ))}
          </ul>
          <div
            aria-hidden
            className="from-card pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t to-transparent"
          />
        </div>
      )}
    </aside>
  );
}
