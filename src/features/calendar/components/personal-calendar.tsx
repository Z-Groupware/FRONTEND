"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./personal-calendar.css";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useMemo } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter,
  type SlotInfo,
  type ToolbarProps,
} from "react-big-calendar";

import { getCalendarHeight } from "../calendar-height";
import { CALENDAR_TAG_DOT_COLOR } from "../tag-colors";
import { CALENDAR_ITEM_TAG_LABEL, type PersonalCalendarEvent } from "../types";
import { CalendarToolbar } from "./calendar-toolbar";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: ko }),
  getDay,
  locales: { ko },
});

function toMonthParam(date: Date): string {
  return format(date, "yyyy-MM");
}

/**
 * 셀 안에는 라벨 색상 막대만 그린다(텍스트 없음) — 제목·태그는 오른쪽 상세조회 패널에서 본다.
 * 스크린리더용 이름은 `sr-only`로 남긴다.
 */
function CalendarEventBar({ event, title }: { event: PersonalCalendarEvent; title: string }) {
  return (
    <span className="sr-only">
      {title}
      {event.isCompleted ? " (완료)" : ""}
    </span>
  );
}

interface PersonalCalendarProps {
  events: PersonalCalendarEvent[];
  /** "YYYY-MM" — 지금 보고 있는 달. 서버 컴포넌트가 이 값 기준으로 이벤트를 걸러 내려준다. */
  month: string;
  /** 툴바 오른쪽 끝, 범례 옆에 같은 줄로 넣을 액션(Todo 추가 버튼). */
  toolbarAction?: ReactNode;
  /** 날짜 셀(빈 곳) 또는 이벤트를 클릭하면 그 날짜를 올려보낸다 — 오른쪽 상세조회 패널이 이걸로 갈아 끼운다. */
  onSelectDate: (date: Date) => void;
}

/**
 * 개인 캘린더 월간 뷰(react-big-calendar).
 * ⚠️ 달 이동은 로컬 state가 아니라 **URL 쿼리(`?month=`)** 로 반영한다 — 그래야 서버 컴포넌트가
 *    그 달 이벤트를 다시 내려준다(CLAUDE.md §핵심 4원칙: 조회는 Server Component).
 */
export function PersonalCalendar({
  events,
  month,
  toolbarAction,
  onSelectDate,
}: PersonalCalendarProps) {
  const router = useRouter();

  const ToolbarWithAction = useCallback(
    (toolbarProps: ToolbarProps<PersonalCalendarEvent>) => (
      <CalendarToolbar {...toolbarProps} action={toolbarAction} />
    ),
    [toolbarAction],
  );

  const currentDate = useMemo(() => parse(`${month}-01`, "yyyy-MM-dd", new Date()), [month]);
  const calendarHeight = useMemo(() => getCalendarHeight(currentDate), [currentDate]);

  const handleNavigate = useCallback(
    (nextDate: Date) => {
      router.push(`/app/calendar?month=${toMonthParam(nextDate)}`);
    },
    [router],
  );

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => onSelectDate(slotInfo.start),
    [onSelectDate],
  );

  const handleSelectEvent = useCallback(
    (event: PersonalCalendarEvent) => onSelectDate(event.start),
    [onSelectDate],
  );

  const eventPropGetter = useCallback<EventPropGetter<PersonalCalendarEvent>>((event) => {
    return {
      style: {
        // 범례(`calendar-legend.tsx`)·리스트(`calendar-event-list-item.tsx`)와 같은 색 하나를 공유한다.
        backgroundColor: event.color ?? CALENDAR_TAG_DOT_COLOR[event.tag],
        opacity: event.isCompleted ? 0.55 : 1,
      },
      title: `${event.title} (${CALENDAR_ITEM_TAG_LABEL[event.tag]})`,
    };
  }, []);

  return (
    <Calendar
      localizer={localizer}
      events={events}
      views={["month"]}
      defaultView="month"
      date={currentDate}
      onNavigate={handleNavigate}
      eventPropGetter={eventPropGetter}
      components={{ toolbar: ToolbarWithAction, event: CalendarEventBar }}
      selectable
      onSelectSlot={handleSelectSlot}
      onSelectEvent={handleSelectEvent}
      showAllEvents
      style={{ height: calendarHeight }}
      messages={{
        today: "오늘",
        previous: "이전",
        next: "다음",
        month: "월",
        week: "주",
        day: "일",
        agenda: "일정",
        showMore: (count: number) => `+${count} 더보기`,
        noEventsInRange: "이 기간에 일정이 없어요",
      }}
    />
  );
}
