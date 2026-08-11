import { format } from "date-fns";
import type { Metadata } from "next";

import { RoomsBoard } from "@/features/rooms/components/rooms-board";
import {
  getMeetingRooms,
  getReservableMembers,
  getReservableProjects,
  getReservableTeamActions,
  getWeekReservations,
} from "@/features/rooms/server";
import { getViewer } from "@/features/shell/viewer";
import { requiresParentTeamAction } from "@/lib/permission";

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

  // ⚠️ 팀 액션 목록은 지금 보고 있는 사람이 누구인지(권한·소속 팀)에 따라 달라져서 먼저 받는다.
  const viewer = await getViewer();

  const [reservations, rooms, members, projects, teamActions] = await Promise.all([
    getWeekReservations(week),
    getMeetingRooms(),
    getReservableMembers(),
    getReservableProjects(),
    getReservableTeamActions(viewer),
  ]);

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-7 lg:overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-7">
        <RoomsBoard
          key={format(week, "yyyy-MM-dd")}
          initialReservations={reservations}
          rooms={rooms}
          members={members}
          projects={projects}
          showParentTeamAction={requiresParentTeamAction(viewer)}
          teamActions={teamActions}
          viewerTeamName={viewer.teamName ?? null}
          week={format(week, "yyyy-MM-dd")}
        />
      </div>
    </main>
  );
}
