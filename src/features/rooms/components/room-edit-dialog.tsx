"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";

import { updateMeetingRoomAction } from "../actions";
import type { MeetingRoom } from "../types";
import { RoomForm } from "./room-form";

interface RoomEditDialogProps {
  /** 목록(서버 컴포넌트)이 이미 받아 온 값 — 모달을 위해 다시 조회하지 않는다 */
  room: MeetingRoom;
}

/** "수정" 트리거 + 수정 모달 — `room-create-dialog.tsx`와 같은 골격이다. */
export function RoomEditDialog({ room }: RoomEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <>
      <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
        <Pencil aria-hidden />
        수정
      </Button>

      <ConfirmDialog
        isOpen={open}
        onOpenChange={(next) => {
          if (!next && isSubmitting) return;
          setOpen(next);
        }}
        title="회의실 정보를 수정할까요?"
        description="바뀐 정보가 예약 화면에 바로 반영됩니다."
        confirmLabel="저장"
        pendingLabel="저장 중"
        isPending={isSubmitting}
        onConfirm={() => formRef.current?.requestSubmit()}
      >
        <RoomForm
          action={updateMeetingRoomAction}
          room={room}
          formRef={formRef}
          onPendingChange={setIsSubmitting}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
            toast.success("회의실 정보를 수정했습니다");
          }}
        />
      </ConfirmDialog>
    </>
  );
}
