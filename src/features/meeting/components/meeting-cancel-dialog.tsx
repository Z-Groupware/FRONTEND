"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";

import { cancelMeetingAction } from "../actions";

interface MeetingCancelDialogProps {
  meetingId: string;
}

/**
 * 회의 취소(MEET-06) — 상세 머리글의 [회의 취소] 버튼이 연다.
 * ⚠️ 트리거·노출 조건(host·SCHEDULED만)은 `MeetingDetailView`가 정한다 — 여기는 확인 흐름만.
 * ⚠️ **소프트 취소다** — 회의 자체는 삭제되지 않는다(BE `V3.3.3`처럼 `status`+`canceled_at`으로
 *    남는다). `RoomDeleteDialog`와 같은 골격(`useTransition` + 서버 액션 직접 호출)이되,
 *    실패(이미 시작된 회의 등)는 창을 닫지 않고 `ConfirmDialog`의 `error` 자리에 띄운다 —
 *    되돌릴 수 없는 일이 막혔을 때 토스트만 쓰면 몇 초 뒤엔 아무 일도 없던 것처럼 보인다.
 */
export function MeetingCancelDialog({ meetingId }: MeetingCancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await cancelMeetingAction(meetingId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
      toast.success("회의를 취소했습니다");
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        회의 취소
      </Button>

      <ConfirmDialog
        isOpen={open}
        onOpenChange={(next) => {
          if (!next && isPending) return;
          setOpen(next);
        }}
        title="이 회의를 취소할까요?"
        description="취소하면 예약된 회의실 시간이 풀리고 참석자에게 취소 알림이 전송됩니다. 회의 자체는 기록으로 남지만 되돌릴 수 없습니다."
        confirmLabel="회의 취소"
        pendingLabel="취소하는 중"
        isDestructive
        isPending={isPending}
        error={error}
        onConfirm={handleConfirm}
      />
    </>
  );
}
