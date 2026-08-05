"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./personal-calendar.css";

import {
  differenceInCalendarWeeks,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useMemo } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter,
  type ToolbarProps,
} from "react-big-calendar";

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

/** 그 달이 몇 주(행)로 그려지는지 — 5주가 기본, 5일이 남으면 6주가 된다. */
function getWeeksInMonth(date: Date): number {
  const start = startOfWeek(startOfMonth(date), { locale: ko });
  const end = endOfWeek(endOfMonth(date), { locale: ko });
  return differenceInCalendarWeeks(end, start, { locale: ko }) + 1;
}

/** 요일 헤더 높이 — `personal-calendar.css`의 `.rbc-header` padding(8px*2)+글자 한 줄 기준. */
const HEADER_HEIGHT_PX = 37;
/** 5주짜리 달 기준 컨테이너 높이 — 지금까지 쓰던 값을 그대로 "행 5개 기준선"으로 삼는다. */
const BASE_HEIGHT = "calc(100vh - 216px)";
const BASE_WEEKS = 5;

/**
 * 달마다 5주/6주로 행 수가 갈리는데, 컨테이너 높이를 고정해두면 RBC가 행 수만큼 나눠 채우기 때문에
 * 6주짜리 달에서 한 행이 얇아진다(§디자인 일관성 — 달을 넘길 때 셀 높이가 출렁이면 안 된다).
 * 그래서 **한 행의 높이를 5주 기준으로 고정**하고, 6주짜리 달은 컨테이너 전체 높이를 그만큼 늘린다
 * (기존 행은 그대로, 아래로 한 행만 더 생긴다).
 */
function getCalendarHeight(weeks: number): string {
  const rowHeightExpr = `((${BASE_HEIGHT} - ${HEADER_HEIGHT_PX}px) / ${BASE_WEEKS})`;
  return `calc(${HEADER_HEIGHT_PX}px + ${weeks} * ${rowHeightExpr})`;
}

interface PersonalCalendarProps {
  events: PersonalCalendarEvent[];
  /** "YYYY-MM" — 지금 보고 있는 달. 서버 컴포넌트가 이 값 기준으로 이벤트를 걸러 내려준다. */
  month: string;
  /** 툴바 오른쪽 끝, 범례 옆에 같은 줄로 넣을 액션(Todo 추가 버튼). */
  toolbarAction?: ReactNode;
}

/**
 * 개인 캘린더 월간 뷰(react-big-calendar).
 * ⚠️ 달 이동은 로컬 state가 아니라 **URL 쿼리(`?month=`)** 로 반영한다 — 그래야 서버 컴포넌트가
 *    그 달 이벤트를 다시 내려준다(CLAUDE.md §핵심 4원칙: 조회는 Server Component).
 */
export function PersonalCalendar({ events, month, toolbarAction }: PersonalCalendarProps) {
  const router = useRouter();

  const ToolbarWithAction = useCallback(
    (toolbarProps: ToolbarProps<PersonalCalendarEvent>) => (
      <CalendarToolbar {...toolbarProps} action={toolbarAction} />
    ),
    [toolbarAction],
  );

  const currentDate = useMemo(() => parse(`${month}-01`, "yyyy-MM-dd", new Date()), [month]);
  const calendarHeight = useMemo(
    () => getCalendarHeight(getWeeksInMonth(currentDate)),
    [currentDate],
  );

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
      components={{ toolbar: ToolbarWithAction }}
      popup
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
