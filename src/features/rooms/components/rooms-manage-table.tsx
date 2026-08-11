import { CalendarDays } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";

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
  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">회의실 목록</h2>
        <p className="text-muted-foreground text-[12px] leading-4">전체 {rooms.length}개</p>
      </div>

      {rooms.length === 0 ? (
        /*
          ⚠️ **빈 자리도 표가 시작하는 선 아래다**(2026-08-11). 선 없이 글자만 띄워 두니
             제목과 안내문이 한 덩이로 붙어 카드가 반쯤 지어진 것처럼 보였다 — 다른 목록
             카드와 같은 자리·같은 여백을 쓴다.
        */
        <EmptyState
          bordered
          icon={CalendarDays}
          title="등록된 회의실이 없습니다."
          description="회의실을 추가하면 예약 화면의 목록에 바로 나타납니다."
        />
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
                <th className="px-7 py-3 text-left font-normal">이름</th>
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
                  <td className="px-7 py-3.5 text-left">{room.name}</td>
                  <td className="px-4 py-3.5 text-center">{room.location}</td>
                  <td className="px-4 py-3.5 text-center tabular-nums">
                    {room.openTime} - {room.closeTime}
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
