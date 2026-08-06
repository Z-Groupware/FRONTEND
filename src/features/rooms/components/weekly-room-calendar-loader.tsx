"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import { WEEKLY_CALENDAR_HEIGHT_PX } from "../calendar-height";
import type { RoomMember, RoomReservation } from "../types";

/** `react-big-calendar`는 무겁다 — 첫 로드 번들에서 뺀다(CLAUDE.md §최적화). */
const WeeklyRoomCalendar = dynamic(
  () => import("./weekly-room-calendar").then((m) => m.WeeklyRoomCalendar),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="w-full rounded-lg" style={{ height: WEEKLY_CALENDAR_HEIGHT_PX }} />
    ),
  },
);

interface WeeklyRoomCalendarLoaderProps {
  reservations: RoomReservation[];
  members: RoomMember[];
  week: string;
  onSelectSlot: (start: Date) => void;
}

export function WeeklyRoomCalendarLoader(props: WeeklyRoomCalendarLoaderProps) {
  return <WeeklyRoomCalendar {...props} />;
}
