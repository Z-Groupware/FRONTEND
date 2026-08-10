"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";

import { deleteMeetingRoomAction } from "../actions";
import { ROOM_DELETE_CONFIRM } from "../constants";
import type { MeetingRoom } from "../types";

interface RoomDeleteDialogProps {
  room: MeetingRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 삭제 확인 모달 — 트리거는 표 행의 "⋯" 메뉴(`room-row-actions.tsx`)에 있다.
 * ⚠️ `notice-delete-button.tsx`와 같은 골격(`useTransition` + 서버 액션 직접 호출) — 다만
 *    삭제 뒤 같은 화면에 머무르므로 `redirect` 대신 `router.refresh()`로 목록을 다시 받아온다.
 */
export function RoomDeleteDialog({ room, open, onOpenChange }: RoomDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    const formData = new FormData();
    formData.set("id", room.id);
    // ⚠️ 콜백이 Promise를 반환해야 한다 — 반환하지 않으면 React가 삭제가 끝나기 전에
    //    전환을 "완료"로 보고 `isPending`이 너무 일찍 꺼져 버튼이 풀린다.
    startTransition(async () => {
      await deleteMeetingRoomAction(formData);
      onOpenChange(false);
      router.refresh();
      toast.success("회의실을 삭제했습니다");
    });
  }

  return (
    <ConfirmDialog
      isOpen={open}
      onOpenChange={(next) => {
        if (!next && isPending) return;
        onOpenChange(next);
      }}
      title={ROOM_DELETE_CONFIRM.title(room.name)}
      description={ROOM_DELETE_CONFIRM.description}
      confirmLabel={ROOM_DELETE_CONFIRM.confirmLabel}
      pendingLabel={ROOM_DELETE_CONFIRM.pendingLabel}
      isDestructive
      isPending={isPending}
      onConfirm={handleConfirm}
    />
  );
}
