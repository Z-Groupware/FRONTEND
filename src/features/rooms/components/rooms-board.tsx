"use client";

import type { MeetingRoom, RoomMember, RoomReservation } from "../types";
import { RoomListPanel } from "./room-list-panel";
import { WeeklyRoomCalendarLoader } from "./weekly-room-calendar-loader";

interface RoomsBoardProps {
  initialReservations: RoomReservation[];
  rooms: MeetingRoom[];
  members: RoomMember[];
  /** "YYYY-MM-DD" — 이 주의 월요일. 서버 컴포넌트가 이 주 기준으로 `initialReservations`를 내려준다. */
  week: string;
}

/**
 * 회의실 화면 본체(client).
 * ⚠️ 다음 단계(예약 모달·비관적 갱신)에서 `initialReservations`를 로컬 state로 바꾸고
 *    생성 성공 시 재조회 없이 바로 얹는다(`calendar-board.tsx`와 같은 패턴) — 지금은 읽기전용이라
 *    서버가 내려준 값을 그대로 그린다.
 * ⚠️ 주를 옮기면(`?week=`) 서버가 새 `initialReservations`를 내려주는데, 이 컴포넌트는 그때마다
 *    호출부에서 `key={week}`로 다시 마운트된다(개인 캘린더와 같은 이유).
 */
export function RoomsBoard({ initialReservations, rooms, members, week }: RoomsBoardProps) {
  // ⚠️ 다음 단계(예약 모달)에서 채운다 — 지금은 30분 칸을 눌러도 아직 아무 일도 안 일어난다.
  function handleSelectSlot(start: Date) {
    void start;
  }

  return (
    <div className="flex flex-col gap-6">
      <WeeklyRoomCalendarLoader
        reservations={initialReservations}
        members={members}
        week={week}
        onSelectSlot={handleSelectSlot}
      />
      <RoomListPanel rooms={rooms} />
    </div>
  );
}
