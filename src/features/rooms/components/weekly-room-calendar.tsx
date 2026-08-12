"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./weekly-room-calendar.css";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type SlotInfo, type ToolbarProps } from "react-big-calendar";

import { getReservationAccentColor } from "../accent-color";
import { WEEKLY_CALENDAR_HEIGHT_PX } from "../calendar-height";
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
 * 주의: **높이는 반응형이다**(2026-08-10, 팀 확정 — "캘린더가 한 화면에 다 들어와야 한다").
 *    `lg` 미만은 `calendar-height.ts`의 고정값(페이지 스크롤), `lg` 이상은 `lg:h-full!`로
 *    부모 flex 컨테이너의 실제 높이를 그대로 채운다 — RBC가 반칸 높이를 화면 크기에 맞게
 *    다시 나눠 담는다(의도된 동작).
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

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => onSelectSlot(slotInfo.start),
    [onSelectSlot],
  );

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
      step={30}
      timeslots={2}
      min={new Date(0, 0, 0, 8, 0, 0)}
      max={new Date(0, 0, 0, 18, 0, 0)}
      selectable
      onSelectSlot={handleSelectSlot}
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
