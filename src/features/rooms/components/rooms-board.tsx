"use client";

import { useState } from "react";

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
 * 주의: 30분 칸을 클릭하면 그 시작 시각을 `slotStart`에 담아 예약 모달을 연다 — 모달이 열려 있는지는
 *    `slotStart !== null`로만 판단한다(별도 `isOpen` state를 안 둔다).
 * 주의: 주를 옮기면(`?week=`) 서버가 새 `initialReservations`를 내려주는데, 이 컴포넌트는 그때마다
 *    호출부에서 `key={week}`로 다시 마운트된다(개인 캘린더와 같은 이유).
 * 주의: "회의 추가" 진입점은 캘린더 툴바 안(`오늘` 버튼 옆, 2026-08-10 이전엔 이 컴포넌트 위
 *    별도 버튼)으로 옮겼다 — 여는 시각은 `getNextAvailableSlot`이 "지금"을 30분 단위로 올려
 *    계산하는 로직은 그대로다.
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
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <WeeklyRoomCalendarLoader
          reservations={reservations}
          members={members}
          rooms={rooms}
          week={week}
          onSelectSlot={setSlotStart}
          onAddClick={() => setSlotStart(getNextAvailableSlot(new Date()))}
        />
      </div>

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
