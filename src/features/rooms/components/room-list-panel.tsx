import type { MeetingRoom } from "../types";

interface RoomListPanelProps {
  rooms: MeetingRoom[];
}

/**
 * 회의실 목록 — 캘린더 우측 사이드바(2026-08-10, 캘린더 하단에서 이동). 예약은 왼쪽
 * 캘린더에서 하고, 여기는 운영 시간만 빠르게 확인하는 자리.
 * 주의: `lg` 미만에서는 캘린더 아래로 쌓인다(`rooms-board.tsx`) — `CalendarDayDetailPanel`과 같은 패턴.
 */
export function RoomListPanel({ rooms }: RoomListPanelProps) {
  return (
    <aside className="border-border bg-card flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border lg:h-full lg:w-[280px] lg:max-w-[280px]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-foreground text-[17px] leading-7 font-semibold tracking-[-0.3px]">
            회의실 목록
          </h2>
          <p className="text-muted-foreground mt-0.5 text-[12px] leading-4">
            예약 가능 시간을 확인해 주세요.
          </p>
        </div>
        <span className="text-muted-foreground shrink-0 text-[12px] leading-4">
          {rooms.length}개
        </span>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="border-border flex items-center justify-between border-t px-5 py-3"
          >
            <span className="text-foreground text-[13px] leading-5">{room.name}</span>
            <span className="text-muted-foreground text-[12px] leading-4 tabular-nums">
              {room.openTime} - {room.closeTime}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
