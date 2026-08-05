"use client";

import { isSameDay, isSameMonth, parse } from "date-fns";
import { useMemo, useState } from "react";

import { getCalendarHeight } from "../calendar-height";
import type { PersonalCalendarEvent } from "../types";
import { AddTodoDialog } from "./add-todo-dialog";
import { CalendarDayDetailPanel } from "./calendar-day-detail-panel";
import { PersonalCalendarLoader } from "./personal-calendar-loader";

interface CalendarBoardProps {
  initialEvents: PersonalCalendarEvent[];
  /** "YYYY-MM" — 서버 컴포넌트가 이 달 기준으로 `initialEvents`를 내려준다. */
  month: string;
}

/** 기본 선택 날짜 — 지금 보는 달에 오늘이 있으면 오늘, 아니면 1일. */
function defaultSelectedDate(month: string): Date {
  const firstDay = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  const today = new Date();
  return isSameMonth(firstDay, today) ? today : firstDay;
}

/**
 * 개인 캘린더 화면 본체(client). 서버가 내려준 이벤트를 로컬 state로 들고 있다가,
 * Todo 추가 성공 시 재조회 없이 바로 얹는다(§최적화: action 리턴값으로 화면 반영).
 * ⚠️ 달을 옮기면(`?month=`) 서버가 새 `initialEvents`를 내려주는데, 이 컴포넌트는 그때마다
 *    호출부에서 `key={month}`로 다시 마운트된다 — props를 state로 동기화하는 effect 대신
 *    리마운트로 초기화한다(React 권장 패턴, `useEffect`로 setState하면 캐스케이딩 렌더가 생긴다).
 * ⚠️ "Todo 추가" 버튼은 별도 줄이 아니라 캘린더 툴바 안(범례 옆)에 같은 줄로 넣는다 —
 *    `toolbarAction`으로 RBC 툴바 안까지 전달한다(`personal-calendar.tsx` 참고).
 * ⚠️ 오른쪽 날짜 상세조회 패널은 셀/이벤트 클릭마다 `selectedDate`만 바뀌고 새로 마운트되지
 *    않는다 — 같은 달 안에서 API를 다시 부를 필요가 없어서(이미 이번 달 이벤트를 다 들고 있다).
 * ⚠️ 캘린더 높이를 여기서 **미리 계산해 바깥 행에 명시적으로** 준다 — flex 스트레치에만 기대면
 *    (`items-stretch`) 오른쪽 패널의 `border-l`이 캘린더가 아니라 안쪽 콘텐츠 높이만큼만
 *    그려지는 문제가 있었다. 캘린더(`personal-calendar.tsx`)도 같은 계산 함수로 같은 값을
 *    쓰니 항상 일치한다.
 */
export function CalendarBoard({ initialEvents, month }: CalendarBoardProps) {
  const [events, setEvents] = useState(initialEvents);
  const [selectedDate, setSelectedDate] = useState(() => defaultSelectedDate(month));

  const dayEvents = useMemo(
    () => events.filter((event) => isSameDay(event.start, selectedDate)),
    [events, selectedDate],
  );

  const calendarHeight = useMemo(
    () => getCalendarHeight(parse(`${month}-01`, "yyyy-MM-dd", new Date())),
    [month],
  );

  return (
    <div className="flex items-stretch gap-6" style={{ height: calendarHeight }}>
      <div className="min-w-0 flex-1">
        <PersonalCalendarLoader
          events={events}
          month={month}
          onSelectDate={setSelectedDate}
          toolbarAction={
            <AddTodoDialog
              month={month}
              onCreated={(created) => setEvents((prev) => [...prev, created])}
            />
          }
        />
      </div>

      <CalendarDayDetailPanel selectedDate={selectedDate} events={dayEvents} />
    </div>
  );
}
