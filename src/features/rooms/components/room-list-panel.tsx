import type { MeetingRoom } from "../types";

interface RoomListPanelProps {
  rooms: MeetingRoom[];
}

/** 하단 회의실 목록 — 예약은 위 캘린더에서 하고, 여기는 운영 시간만 빠르게 확인하는 자리. */
export function RoomListPanel({ rooms }: RoomListPanelProps) {
  return (
    <section className="border-border bg-card rounded-lg border">
      <header className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-foreground text-base font-semibold">회의실 목록</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            예약 가능 시간을 빠르게 확인하세요. 예약은 캘린더에서 진행합니다.
          </p>
        </div>
        <span className="text-muted-foreground text-xs">{rooms.length}개</span>
      </header>

      <ul>
        {rooms.map((room) => (
          <li
            key={room.id}
            className="border-border flex items-center justify-between border-t px-5 py-3"
          >
            <span className="text-foreground text-sm">{room.name}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {room.openTime} - {room.closeTime}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
