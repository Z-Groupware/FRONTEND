"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import { WEEKLY_CALENDAR_HEIGHT_PX } from "../calendar-height";
import type { MeetingRoom, RoomMember, RoomReservation } from "../types";

/** `react-big-calendar`는 무겁다 — 첫 로드 번들에서 뺀다(CLAUDE.md §최적화). */
const WeeklyRoomCalendar = dynamic(
  () => import("./weekly-room-calendar").then((m) => m.WeeklyRoomCalendar),
  {
    ssr: false,
    // 주의: 실제 캘린더와 같은 반응형 높이 규칙 — `lg` 이상은 부모가 주는 실제 높이를 채운다.
    loading: () => (
      <Skeleton
        className="w-full rounded-lg lg:h-full!"
        style={{ height: WEEKLY_CALENDAR_HEIGHT_PX }}
      />
    ),
  },
);

interface WeeklyRoomCalendarLoaderProps {
  reservations: RoomReservation[];
  members: RoomMember[];
  rooms: MeetingRoom[];
  week: string;
  onSelectSlot: (start: Date) => void;
}

export function WeeklyRoomCalendarLoader(props: WeeklyRoomCalendarLoaderProps) {
  return <WeeklyRoomCalendar {...props} />;
}
