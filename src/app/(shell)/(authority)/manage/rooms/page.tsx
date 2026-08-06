import type { Metadata } from "next";

import { RoomCreateDialog } from "@/features/rooms/components/room-create-dialog";
import { RoomsManageTable } from "@/features/rooms/components/rooms-manage-table";
import { getMeetingRooms } from "@/features/rooms/server";
import { getViewer } from "@/features/shell/viewer";
import { canManageRooms } from "@/lib/permission";

export const metadata: Metadata = {
  title: "회의실 관리",
};

/**
 * 회의실 관리(`/manage/rooms`, is_admin 전용, WORKFLOW.md §10-A) — 목록 + 추가/수정 모달.
 * 예약 승인 절차가 없다 — 저장 즉시 `/app/rooms` 예약 모달의 회의실 select에 나타난다.
 * ⚠️ 화면 가드는 UX일 뿐이다 — 추가·수정 Server Action이 `canManageRooms`로 다시 본다(§권한).
 */
export default async function ManageRoomsPage() {
  const [rooms, viewer] = await Promise.all([getMeetingRooms(), getViewer()]);
  const canManage = canManageRooms(viewer);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        {canManage && (
          <div className="flex justify-end">
            <RoomCreateDialog />
          </div>
        )}

        <RoomsManageTable rooms={rooms} canManage={canManage} />
      </div>
    </main>
  );
}
