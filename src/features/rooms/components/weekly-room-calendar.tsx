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
import type { RoomMember, RoomReservation } from "../types";
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
  reservations: RoomReservation[];
  members: RoomMember[];
  /** "YYYY-MM-DD" — 이 주의 월요일. 서버 컴포넌트가 이 값 기준으로 예약을 걸러 내려준다. */
  week: string;
  /** 빈 슬롯을 선택하면(30분 칸 클릭) 그 시작 시각을 올려보낸다 — 예약 모달이 이 값으로 연다. */
  onSelectSlot: (start: Date) => void;
}

/**
 * 회의실 주간 캘린더(react-big-calendar `work_week` 뷰 — 평일 5일만, 팀 화면 목업과 동일).
 * ⚠️ 개인 캘린더(`personal-calendar.tsx`)와 달리 이벤트 막대에 **글자를 그대로 보여준다** —
 *    회의실 화면엔 오른쪽 상세조회 패널이 따로 없어서, 셀 안에서 제목·시간·참석자를 바로 봐야 한다.
 * ⚠️ 예약은 **30분 한 타임 고정**이다(CLAUDE.md §브라우저 API, 팀 확정) — 시드 데이터도 예외
 *    없이 30분이다. `step=30, timeslots=2`로 "정시(그룹, 실선)/반시(슬롯, 점선)" 두 겹 그리드를
 *    만들고, 칸 높이는 `calendar-height.ts`가 30분 콘텐츠(제목·시간·참석자)가 항상 들어갈 만큼
 *    먼저 정한 값을 그대로 쓴다(뷰포트 비율로 두면 칸이 다시 얇아진다).
 */
export function WeeklyRoomCalendar({
  reservations,
  members,
  week,
  onSelectSlot,
}: WeeklyRoomCalendarProps) {
  const router = useRouter();

  const currentDate = useMemo(() => parse(week, "yyyy-MM-dd", new Date()), [week]);

  const handleNavigate = useCallback(
    (nextDate: Date) => {
      router.push(`/app/rooms?week=${toWeekParam(nextDate)}`);
    },
    [router],
  );

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => onSelectSlot(slotInfo.start),
    [onSelectSlot],
  );

  const EventComponent = useCallback(
    ({ event }: { event: RoomReservation }) => (
      <RoomReservationEvent
        event={event}
        members={members}
        accentColor={getReservationAccentColor(event.projectTag)}
      />
    ),
    [members],
  );

  const ToolbarComponent = useCallback(
    (toolbarProps: ToolbarProps<RoomReservation>) => <RoomsCalendarToolbar {...toolbarProps} />,
    [],
  );

  return (
    <Calendar
      localizer={localizer}
      events={reservations}
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
      style={{ height: WEEKLY_CALENDAR_HEIGHT_PX }}
      formats={{
        dayFormat: (date: Date) => format(date, "EEE M/d", { locale: ko }),
        timeGutterFormat: (date: Date) => format(date, "H:mm"),
      }}
      messages={{
        today: "오늘",
        previous: "이전",
        next: "다음",
        noEventsInRange: "이번 주엔 예약된 회의가 없어요",
      }}
    />
  );
}
