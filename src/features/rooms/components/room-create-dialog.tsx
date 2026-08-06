"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { createMeetingRoomAction } from "../actions";
import { RoomForm } from "./room-form";

/**
 * "회의실 추가" 트리거 + 추가 모달 — 전용 라우트 대신 모달로 연다(`notice-create-dialog.tsx`와 같은 패턴).
 * ⚠️ 목록(`rooms-manage-table.tsx`)은 서버 컴포넌트라 성공 뒤 `router.refresh()`로 다시 받아온다
 *    (`revalidatePath`가 이미 캐시를 무효화해 뒀다).
 */
export function RoomCreateDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button type="button" size="sm" variant="ink" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        회의실 추가
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          // ⚠️ 제출 중엔 Esc·바깥 클릭으로 안 닫는다 — 요청은 계속 가는데 화면만 사라지면 결과를 못 본다.
          if (!next && isSubmitting) return;
          setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>회의실을 추가할까요?</DialogTitle>
          </DialogHeader>

          <RoomForm
            action={createMeetingRoomAction}
            submitLabel="추가"
            onCancel={() => setOpen(false)}
            onPendingChange={setIsSubmitting}
            onSuccess={(room) => {
              setOpen(false);
              router.refresh();
              toast.success(`'${room.name}' 회의실을 추가했습니다`);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
