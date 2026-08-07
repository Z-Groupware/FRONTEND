"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { updateMeetingRoomAction } from "../actions";
import type { MeetingRoom } from "../types";
import { RoomForm } from "./room-form";

interface RoomEditDialogProps {
  /** 목록(서버 컴포넌트)이 이미 받아 온 값 — 모달을 위해 다시 조회하지 않는다 */
  room: MeetingRoom;
}

/** "수정" 트리거 + 수정 모달 — `notice-edit-dialog.tsx`와 같은 패턴. */
export function RoomEditDialog({ room }: RoomEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
        <Pencil aria-hidden />
        수정
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && isSubmitting) return;
          setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>회의실 정보를 수정할까요?</DialogTitle>
          </DialogHeader>

          <RoomForm
            action={updateMeetingRoomAction}
            room={room}
            submitLabel="저장"
            onCancel={() => setOpen(false)}
            onPendingChange={setIsSubmitting}
            onSuccess={(updated) => {
              setOpen(false);
              router.refresh();
              toast.success(`'${updated.name}' 정보를 수정했습니다`);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
