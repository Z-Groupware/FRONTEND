"use client";

import { useState } from "react";

import type { PersonalCalendarEvent } from "../types";
import { AddTodoDialog } from "./add-todo-dialog";
import { PersonalCalendarLoader } from "./personal-calendar-loader";

interface CalendarBoardProps {
  initialEvents: PersonalCalendarEvent[];
  /** "YYYY-MM" — 서버 컴포넌트가 이 달 기준으로 `initialEvents`를 내려준다. */
  month: string;
}

/**
 * 개인 캘린더 화면 본체(client). 서버가 내려준 이벤트를 로컬 state로 들고 있다가,
 * Todo 추가 성공 시 재조회 없이 바로 얹는다(§최적화: action 리턴값으로 화면 반영).
 * ⚠️ 달을 옮기면(`?month=`) 서버가 새 `initialEvents`를 내려주는데, 이 컴포넌트는 그때마다
 *    호출부에서 `key={month}`로 다시 마운트된다 — props를 state로 동기화하는 effect 대신
 *    리마운트로 초기화한다(React 권장 패턴, `useEffect`로 setState하면 캐스케이딩 렌더가 생긴다).
 */
export function CalendarBoard({ initialEvents, month }: CalendarBoardProps) {
  const [events, setEvents] = useState(initialEvents);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <AddTodoDialog
          month={month}
          onCreated={(created) => setEvents((prev) => [...prev, created])}
        />
      </div>

      <PersonalCalendarLoader events={events} month={month} />
    </div>
  );
}
