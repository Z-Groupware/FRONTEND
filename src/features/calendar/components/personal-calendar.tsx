"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./personal-calendar.css";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type EventPropGetter } from "react-big-calendar";

import { CALENDAR_ITEM_TAG, CALENDAR_ITEM_TAG_LABEL, type PersonalCalendarEvent } from "../types";
import { CalendarToolbar } from "./calendar-toolbar";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: ko }),
  getDay,
  locales: { ko },
});

/** 태그별 기본 배경/글자색 — 항목에 `color`가 없을 때만 쓴다(§도메인 상수: 항목별 커스텀 색상). */
const TAG_SURFACE: Record<PersonalCalendarEvent["tag"], { bg: string; fg: string }> = {
  [CALENDAR_ITEM_TAG.PERSONAL_TODO]: {
    bg: "var(--calendar-todo-surface)",
    fg: "var(--calendar-todo)",
  },
  [CALENDAR_ITEM_TAG.PERSONAL_ACTION]: {
    bg: "var(--calendar-action-surface)",
    fg: "var(--calendar-action)",
  },
};

function toMonthParam(date: Date): string {
  return format(date, "yyyy-MM");
}

interface PersonalCalendarProps {
  events: PersonalCalendarEvent[];
  /** "YYYY-MM" — 지금 보고 있는 달. 서버 컴포넌트가 이 값 기준으로 이벤트를 걸러 내려준다. */
  month: string;
}

/**
 * 개인 캘린더 월간 뷰(react-big-calendar).
 * ⚠️ 달 이동은 로컬 state가 아니라 **URL 쿼리(`?month=`)** 로 반영한다 — 그래야 서버 컴포넌트가
 *    그 달 이벤트를 다시 내려준다(CLAUDE.md §핵심 4원칙: 조회는 Server Component).
 */
export function PersonalCalendar({ events, month }: PersonalCalendarProps) {
  const router = useRouter();

  const currentDate = useMemo(() => parse(`${month}-01`, "yyyy-MM-dd", new Date()), [month]);

  const handleNavigate = useCallback(
    (nextDate: Date) => {
      router.push(`/app/calendar?month=${toMonthParam(nextDate)}`);
    },
    [router],
  );

  const eventPropGetter = useCallback<EventPropGetter<PersonalCalendarEvent>>((event) => {
    const surface = TAG_SURFACE[event.tag];
    return {
      style: {
        backgroundColor: event.color ?? surface.bg,
        color: event.color ? "var(--foreground)" : surface.fg,
        opacity: event.isCompleted ? 0.55 : 1,
        textDecoration: event.isCompleted ? "line-through" : "none",
      },
      title: CALENDAR_ITEM_TAG_LABEL[event.tag],
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
      components={{ toolbar: CalendarToolbar }}
      popup
      style={{ height: "calc(100vh - 216px)" }}
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
