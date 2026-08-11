import { CalendarRange, Clock, MapPin } from "lucide-react";

import type { MeetingRoom } from "../types";
import { RoomRowActions } from "./room-row-actions";

interface RoomsManageTableProps {
  rooms: MeetingRoom[];
  /** false면 "수정" 열 자체를 안 그린다 — 화면 가드는 UX일 뿐이고, 진짜 검사는 Server Action이 한다. */
  canManage: boolean;
}

/**
 * 회의실 목록(관리) — 카드 anatomy는 DESIGN.md §2, 표는 §3을 따른다.
 * ⚠️ `/app/rooms`의 읽기전용 `room-list-panel.tsx`와 다르다 — 여기는 관리자가 고치는 표라
 *    "위치"·"수정" 열이 더 있다.
 */
export function RoomsManageTable({ rooms, canManage }: RoomsManageTableProps) {
  // 파생값 — "위치 N곳"은 저장된 필드가 아니라 회의실 목록에서 그때 계산한다(CLAUDE.md §도메인 상수).
  const locationCount = new Set(rooms.map((room) => room.location)).size;

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        {/* ⚠️ 제목 앞 검은 점 대신 상단바와 같은 아이콘을 쓴다 — 점은 상태점과 헷갈린다(DESIGN §5) */}
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <CalendarRange className="text-muted-foreground size-4" aria-hidden />
          회의실 목록
        </h2>
        <p className="text-muted-foreground text-xs tabular-nums">
          전체 {rooms.length}개 · 위치 {locationCount}곳
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="flex items-center justify-center p-10 text-center">
          <p className="text-muted-foreground text-sm">등록된 회의실이 없습니다</p>
        </div>
      ) : (
        <div className="border-border overflow-x-auto border-t">
          <table className="w-full min-w-[560px] table-fixed text-[13px]">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[28%]" />
              <col className="w-[26%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="text-muted-foreground bg-secondary/50 border-border border-b text-[12px] leading-4">
                <th className="px-6 py-3 text-left font-normal">이름</th>
                <th className="px-4 py-3 text-center font-normal">위치</th>
                <th className="px-4 py-3 text-center font-normal">이용 가능 시간</th>
                <th className="px-4 py-3 text-center font-normal">
                  <span className="sr-only">관리</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr
                  key={room.id}
                  className="group border-border hover:bg-foreground/[0.04] transition-colors not-first:border-t"
                >
                  <td className="px-6 py-3.5 text-left font-medium">{room.name}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {room.location}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center tabular-nums">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0" aria-hidden />
                      {room.openTime} - {room.closeTime}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {canManage && <RoomRowActions room={room} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
