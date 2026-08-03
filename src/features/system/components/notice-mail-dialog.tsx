"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { sendUnpaidNoticeAction } from "../actions";

interface NoticeMailDialogProps {
  /** 발송 대상. `null`이면 닫힌 상태다(`department-delete-dialog.tsx`와 같은 패턴). */
  target: { companyId: string; companyName: string; ownerEmail: string } | null;
  onClose: () => void;
}

/**
 * 미납 기업 담당자에게 안내 메일을 보낼지 묻는 확인창.
 *
 * ⚠️ **파괴적 조작은 토스트가 아니라 Dialog로 확인받는다**(CLAUDE.md §토스트: 확인은 Dialog).
 *    메일 발송 자체는 되돌릴 수 없는 일이라 예/아니오로 한 번 더 확인한다.
 * ⚠️ 목이라 **실제로 메일이 나가지 않는다** — 성공 흉내만 낸다. 조용히 되는 척하지 않도록
 *    발송 완료 토스트 문구에도 이 사실을 남긴다(§정직성).
 */
export function NoticeMailDialog({ target, onClose }: NoticeMailDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!target) return;

    startTransition(async () => {
      const result = await sendUnpaidNoticeAction(target.companyId);

      if (result.success) {
        toast(`${target.companyName} 담당자에게 안내 메일을 발송했어요`);
      } else {
        toast(`${target.companyName} 정보를 찾을 수 없어 발송하지 못했어요`);
      }

      onClose();
    });
  };

  return (
    <Dialog open={target !== null} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>안내 메일을 보낼까요?</DialogTitle>
          <DialogDescription>
            {target?.companyName} 담당자({target?.ownerEmail})에게 안내 이메일을 발송하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            아니오
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "발송 중…" : "예"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
