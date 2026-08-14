"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./weekly-room-calendar.css";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { type MouseEvent as ReactMouseEvent, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type ToolbarProps } from "react-big-calendar";

import { getReservationAccentColor } from "../accent-color";
import { WEEKLY_CALENDAR_HEIGHT_PX } from "../calendar-height";
import { findSlotStart, GRID_END_HOUR, GRID_START_HOUR, SLOT_MINUTES } from "../grid-slot";
import type { MeetingRoom, RoomCalendarEvent, RoomMember } from "../types";
import { RoomReservationEvent } from "./room-reservation-event";
import { RoomsCalendarToolbar } from "./rooms-calendar-toolbar";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { ko },
});

function toWeekParam(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

interface WeeklyRoomCalendarProps {
  events: RoomCalendarEvent[];
  members: RoomMember[];
  rooms: MeetingRoom[];
  /** 지금 그리드가 보여주는 회의실 — ROOM-02 전환(2026-08-10)으로 축이 "회의실 1개 × 5일"이라
   *  화면 표시가 아니라 **서버 재조회 파라미터**다(예전 "전체 회의실" 거르개와 다르다). */
  selectedRoomId: string;
  /** "YYYY-MM-DD" — 이 주의 월요일. 서버 컴포넌트가 이 값·`selectedRoomId` 기준으로 그리드를 내려준다. */
  week: string;
  /** 빈 슬롯을 선택하면(30분 칸 클릭) 그 시작 시각을 올려보낸다 — 예약 모달이 이 값으로 연다. */
  onSelectSlot: (start: Date) => void;
}

/**
 * 회의실 주간 캘린더(react-big-calendar `work_week` 뷰 — 평일 5일만, 팀 화면 목업과 동일).
 * 주의: 개인 캘린더(`personal-calendar.tsx`)와 달리 이벤트 막대에 **글자를 그대로 보여준다** —
 *    회의실 화면엔 오른쪽 상세조회 패널이 따로 없어서, 셀 안에서 제목·시간·참석자를 바로 봐야 한다.
 * 주의: 예약은 **30분 한 타임 고정**이다(CLAUDE.md §브라우저 API, 팀 확정) — 시드 데이터도 예외
 *    없이 30분이다. `step=30, timeslots=2`로 "정시(그룹, 실선)/반시(슬롯, 점선)" 두 겹 그리드를 만든다.
 * 주의: **하루 전체(00:00~24:00)를 보여준다**(2026-08-14 변경 — 이전엔 08:00~18:00만 그렸다,
 *    `grid-slot.ts`).
 * 주의: **칸 높이는 고정이다, 화면 크기에 안 맞춰 준다**(2026-08-14 변경). `lg` 미만은
 *    `calendar-height.ts`의 고정값(페이지 스크롤), `lg` 이상은 `lg:h-full!`로 부모 flex
 *    컨테이너의 실제 높이만 차지하고, 하루 24시간이 그 안에 다 안 들어오면 **캘린더 내부가
 *    스크롤한다**(`weekly-room-calendar.css`의 `lg` 미디어쿼리) — 예전처럼 반칸 높이를
 *    눌러서 한 화면에 억지로 담지 않는다.
 * 주의: **처음 열면 지금 시각 근처로 스크롤한다**(`scrollToTime`) — 하루 전체를 다 그리므로
 *    아무 위치도 안 주면 자정(맨 위)에서 시작해 지금이 몇 시인지 보려고 매번 스크롤해야 한다.
 * 주의: 회의실 거르개(`RoomsCalendarToolbar`)는 이제 **URL(`?roomId=`)을 바꾼다** — ROOM-02가
 *    회의실 하나 기준으로만 그리드를 내려주므로, 화면 안에서 거를 목록 자체가 없다(서버 재조회).
 */
export function WeeklyRoomCalendar({
  events,
  members,
  rooms,
  selectedRoomId,
  week,
  onSelectSlot,
}: WeeklyRoomCalendarProps) {
  const router = useRouter();

  const currentDate = useMemo(() => parse(week, "yyyy-MM-dd", new Date()), [week]);

  const handleNavigate = useCallback(
    (nextDate: Date) => {
      router.push(`/app/rooms?week=${toWeekParam(nextDate)}&roomId=${selectedRoomId}`);
    },
    [router, selectedRoomId],
  );

  const handleSelectedRoomChange = useCallback(
    (roomId: string) => {
      router.push(`/app/rooms?week=${week}&roomId=${roomId}`);
    },
    [router, week],
  );

  /**
   * 빈 칸을 누르면 그 30분 칸의 시작 시각을 올려보낸다 — **RBC의 `selectable`을 안 쓴다.**
   *
   * ⚠️ 그쪽 좌표 계산이 화면 배율(`transform: scale()`)에서 옆 날짜·옆 시간대를 골랐다
   *    (#141). 이유와 대안은 `grid-slot.ts`에 적었다.
   * ⚠️ 리스너는 RBC 뿌리 `div`에 그대로 얹는다(`elementProps`) — 감싸는 `div`를 하나 더 두면
   *    `lg:h-full`이 기대는 flex 사슬이 한 겹 끊겨 캘린더 높이가 무너진다.
   * ⚠️ 키보드로는 `RoomListPanel`의 [회의 추가]가 같은 모달을 연다 — 격자 클릭이 유일한
   *    길이 아니다(CLAUDE.md §a11y).
   * ⚠️ 기준일은 `week`가 아니라 **그 주의 월요일**로 한 번 더 접는다. `work_week` 뷰는 어떤
   *    날짜를 줘도 그 주 월~금을 그리므로, 첫 열이 곧 월요일이다 — URL이 주 중간 날짜를
   *    들고 와도 열 번호와 날짜가 안 갈린다.
   */
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const handleGridClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const start = findSlotStart({ target, clientY: event.clientY, weekStart });
      if (start) onSelectSlot(start);
    },
    [weekStart, onSelectSlot],
  );

  /*
    ⚠️ **최초 마운트에만 적용된다**(react-big-calendar `TimeGrid.calculateScroll`은
       `componentDidMount`에서 한 번만 비율을 계산한다) — 주를 넘겨도 다시 스크롤하지 않는다,
       그건 "처음 진입"이 아니다. 3시간 앞을 맨 위에 두어 지금 시각이 대략 가운데 오게 한다
       (예: 지금 14시면 11시가 맨 위 — 화면에 몇 줄이 보이는지는 실제 칸 높이·화면 크기에
       달라 정확히 "가운데"를 계산하지 않는다, 근사치면 충분하다).
    ⚠️ `useMemo`(빈 배열)로 한 번만 계산한다 — 매 렌더 `new Date()`를 새로 부르면 그 시각이
       바뀔 때마다 `Calendar`가 다른 `scrollToTime`을 받아 다시 스크롤을 시도한다.
  */
  const scrollToTime = useMemo(() => {
    const now = new Date();
    const centeredHour = Math.max(GRID_START_HOUR, now.getHours() - 3);
    return new Date(0, 0, 0, centeredHour, 0, 0);
  }, []);

  const EventComponent = useCallback(
    ({ event }: { event: RoomCalendarEvent }) => (
      <RoomReservationEvent
        title={event.title}
        start={event.start}
        end={event.end}
        attendeeIds={event.attendeeIds}
        members={members}
        accentColor={getReservationAccentColor(event.projectTag ?? event.id)}
      />
    ),
    [members],
  );

  const ToolbarComponent = useCallback(
    (toolbarProps: ToolbarProps<RoomCalendarEvent>) => (
      <RoomsCalendarToolbar
        {...toolbarProps}
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        onSelectedRoomChange={handleSelectedRoomChange}
      />
    ),
    [rooms, selectedRoomId, handleSelectedRoomChange],
  );

  return (
    <Calendar
      localizer={localizer}
      events={events}
      views={["work_week"]}
      defaultView="work_week"
      date={currentDate}
      onNavigate={handleNavigate}
      components={{ toolbar: ToolbarComponent, event: EventComponent }}
      step={SLOT_MINUTES}
      timeslots={2}
      min={new Date(0, 0, 0, GRID_START_HOUR, 0, 0)}
      max={new Date(0, 0, 0, GRID_END_HOUR, 0, 0)}
      scrollToTime={scrollToTime}
      enableAutoScroll
      elementProps={{ onClick: handleGridClick }}
      className="lg:h-full!"
      style={{ height: WEEKLY_CALENDAR_HEIGHT_PX }}
      formats={{
        dayFormat: (date: Date) => format(date, "EEE M/d", { locale: ko }),
        timeGutterFormat: (date: Date) => format(date, "H:mm"),
      }}
      messages={{
        today: "오늘",
        previous: "이전",
        next: "다음",
        noEventsInRange: "이번 주에는 예약된 회의가 없습니다.",
      }}
    />
  );
}
