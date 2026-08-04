"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";

import { sendUnpaidNoticeAction } from "../actions";

interface NoticeMailDialogProps {
  /** 발송 대상. `null`이면 닫힌 상태다(`department-delete-dialog.tsx`와 같은 패턴). */
  target: { companyId: string; companyName: string; ownerEmail: string } | null;
  onClose: () => void;
}

/**
 * 미납 기업 담당자에게 안내 메일을 보낼지 묻는 확인창.
 *
 * ⚠️ **되돌릴 수 없는 조작은 토스트가 아니라 확인창으로 받는다**(§토스트).
 *    창은 공용 `ConfirmDialog`를 쓴다 — 확인창이 화면마다 다르게 생기면 같은 무게의 결정인데
 *    다른 물건처럼 보인다.
 * ⚠️ 버튼 문구는 "예/아니오"가 아니라 **하는 일**을 적는다. 예/아니오는 무엇에 답하는지
 *    다시 위를 읽어야 한다.
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
        // ⚠️ 토스트는 한 줄(220px)이라 짧게 쓴다 — 회사 이름이 길면 그만큼 잘린다(`sonner.tsx`)
        toast("안내 메일을 발송했습니다");
      } else {
        toast("발송하지 못했습니다");
      }

      onClose();
    });
  };

  return (
    <ConfirmDialog
      isOpen={target !== null}
      onOpenChange={onClose}
      title="안내 메일을 보낼까요?"
      description={`${target?.companyName ?? ""} 담당자(${target?.ownerEmail ?? ""})에게 미납 안내 메일이 갑니다.`}
      confirmLabel="보낼게요"
      cancelLabel="그만둘게요"
      isPending={isPending}
      pendingLabel="보내는 중…"
      onConfirm={handleConfirm}
    />
  );
}
