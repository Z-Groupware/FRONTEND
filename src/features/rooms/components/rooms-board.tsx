"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { getNextAvailableSlot } from "../next-available-slot";
import type {
  MeetingRoom,
  RoomMember,
  RoomProjectOption,
  RoomReservation,
  RoomTeamActionOption,
} from "../types";
import { RoomListPanel } from "./room-list-panel";
import { RoomReservationDialog } from "./room-reservation-dialog";
import { WeeklyRoomCalendarLoader } from "./weekly-room-calendar-loader";

interface RoomsBoardProps {
  initialReservations: RoomReservation[];
  rooms: MeetingRoom[];
  members: RoomMember[];
  projects: RoomProjectOption[];
  /** "상위 팀 액션" 필드를 보여줄지 — 서버 컴포넌트(`page.tsx`)가 `requiresParentTeamAction`으로
   *  미리 계산해 내려준다. `lib/permission.ts`는 `server-only`라 클라이언트 컴포넌트에서 직접
   *  못 부른다(여기·`RoomReservationDialog`가 전부 client). */
  showParentTeamAction: boolean;
  teamActions: RoomTeamActionOption[];
  /** 참석자 "내 부서만" 필터 기준 — `RoomReservationDialog`로 그대로 흘려보낸다. */
  viewerTeamName: string | null;
  /** "YYYY-MM-DD" — 이 주의 월요일. 서버 컴포넌트가 이 주 기준으로 `initialReservations`를 내려준다. */
  week: string;
}

/**
 * 회의실 화면 본체(client). 서버가 내려준 예약을 로컬 state로 들고 있다가, 예약 생성 성공 시
 * 재조회 없이 바로 얹는다(`calendar-board.tsx`와 같은 패턴, §최적화: action 리턴값으로 화면 반영).
 * ⚠️ 30분 칸을 클릭하면 그 시작 시각을 `slotStart`에 담아 예약 모달을 연다 — 모달이 열려 있는지는
 *    `slotStart !== null`로만 판단한다(별도 `isOpen` state를 안 둔다).
 * ⚠️ 주를 옮기면(`?week=`) 서버가 새 `initialReservations`를 내려주는데, 이 컴포넌트는 그때마다
 *    호출부에서 `key={week}`로 다시 마운트된다(개인 캘린더와 같은 이유).
 */
export function RoomsBoard({
  initialReservations,
  rooms,
  members,
  projects,
  showParentTeamAction,
  teamActions,
  viewerTeamName,
  week,
}: RoomsBoardProps) {
  const [reservations, setReservations] = useState(initialReservations);
  const [slotStart, setSlotStart] = useState<Date | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* ⚠️ `/app/notice`의 "새 공지"와 같은 자리·같은 패턴이다(우측 정렬, `ink` 버튼) — 캘린더
          칸을 직접 클릭하는 대신 바로 예약을 시작하는 진입점이다. 여는 시각은
          `getNextAvailableSlot`이 "지금"을 30분 단위로 올려 계산한다. */}
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="ink"
          onClick={() => setSlotStart(getNextAvailableSlot(new Date()))}
        >
          <Plus aria-hidden />
          예약하기
        </Button>
      </div>

      <WeeklyRoomCalendarLoader
        reservations={reservations}
        members={members}
        week={week}
        onSelectSlot={setSlotStart}
      />
      <RoomListPanel rooms={rooms} />

      <RoomReservationDialog
        slotStart={slotStart}
        onOpenChange={(open) => !open && setSlotStart(null)}
        rooms={rooms}
        members={members}
        projects={projects}
        showParentTeamAction={showParentTeamAction}
        teamActions={teamActions}
        viewerTeamName={viewerTeamName}
        onCreated={(created) => setReservations((prev) => [...prev, created])}
      />
    </div>
  );
}
