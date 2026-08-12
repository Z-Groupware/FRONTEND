"use client";

import { DoorClosed } from "lucide-react";
import dynamic from "next/dynamic";

import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { WEEKLY_CALENDAR_HEIGHT_PX } from "../calendar-height";
import type { MeetingRoom, RoomCalendarEvent, RoomMember } from "../types";

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
  events: RoomCalendarEvent[];
  members: RoomMember[];
  rooms: MeetingRoom[];
  selectedRoomId: string | null;
  week: string;
  onSelectSlot: (start: Date) => void;
}

export function WeeklyRoomCalendarLoader(props: WeeklyRoomCalendarLoaderProps) {
  if (!props.selectedRoomId) {
    return (
      <div className="border-border bg-card flex w-full items-center justify-center rounded-lg border">
        <EmptyState icon={DoorClosed} title="등록된 회의실이 없습니다" />
      </div>
    );
  }

  return <WeeklyRoomCalendar {...props} selectedRoomId={props.selectedRoomId} />;
}
