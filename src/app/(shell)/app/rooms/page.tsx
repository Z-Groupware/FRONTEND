import { format } from "date-fns";
import type { Metadata } from "next";

import { RoomsBoard } from "@/features/rooms/components/rooms-board";
import {
  getMeetingRooms,
  getReservableMembers,
  getWeekReservations,
} from "@/features/rooms/server";

export const metadata: Metadata = {
  title: "회의실",
};

const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseWeekParam(raw: string | undefined): Date {
  if (raw && DATE_PARAM_PATTERN.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

interface RoomsPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const { week: weekParam } = await searchParams;
  const week = parseWeekParam(weekParam);

  const [reservations, rooms, members] = await Promise.all([
    getWeekReservations(week),
    getMeetingRooms(),
    getReservableMembers(),
  ]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <RoomsBoard
          key={format(week, "yyyy-MM-dd")}
          initialReservations={reservations}
          rooms={rooms}
          members={members}
          week={format(week, "yyyy-MM-dd")}
        />
      </div>
    </main>
  );
}
