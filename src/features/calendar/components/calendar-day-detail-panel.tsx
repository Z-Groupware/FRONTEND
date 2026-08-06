"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";

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
 *    위쪽 경계선을 쓰고, 고정 높이 대신 최소 높이만 준다. 폭 제한(`max-w-[230px]`)도 `lg`에서만
 *    건다 — 그 아래에서는 좁은 화면 전체를 다 쓴다.
 */
export function CalendarDayDetailPanel({
  selectedDate,
  events,
  onToggleCompletion,
}: CalendarDayDetailPanelProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  // ⚠️ 전역 규칙(globals.css)이 스크롤바를 감춘다 — 아래쪽 그라데이션으로 "더 있다"를 대신
  //    알린다. 단, 실제로 넘칠 때만 — 짧은 목록엔 안 그리고, 끝까지 내리면 사라진다.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    function updateOverflow() {
      if (!list) return;
      const remaining = list.scrollHeight - list.clientHeight - list.scrollTop;
      setHasMoreBelow(remaining > 1);
    }

    updateOverflow();
    list.addEventListener("scroll", updateOverflow);
    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(list);

    return () => {
      list.removeEventListener("scroll", updateOverflow);
      resizeObserver.disconnect();
    };
  }, [events]);

  return (
    <aside className="border-border flex min-h-[240px] w-full shrink-0 flex-col border-t pt-6 lg:h-full lg:min-h-0 lg:w-[230px] lg:max-w-[230px] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
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
        <div className="relative min-h-0 flex-1">
          <ul ref={listRef} className="flex h-full flex-col gap-2 overflow-y-auto">
            {events.map((event) => (
              <CalendarEventListItem
                key={event.id}
                event={event}
                onToggleCompletion={onToggleCompletion}
              />
            ))}
          </ul>
          {hasMoreBelow && (
            <div
              aria-hidden
              className="from-card pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t to-transparent"
            />
          )}
        </div>
      )}
    </aside>
  );
}
