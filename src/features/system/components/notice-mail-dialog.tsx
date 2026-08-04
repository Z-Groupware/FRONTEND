"use client";

import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NoticeMailDialogProps {
  /** 발송 대상. `null`이면 닫힌 상태다(`department-delete-dialog.tsx`와 같은 패턴). */
  target: { companyId: string; companyName: string; ownerEmail: string } | null;
  onCancel: () => void;
  onConfirm: (companyId: string) => void;
  isPending: boolean;
}

/**
 * 미납 기업 담당자에게 안내 메일을 보낼지 묻는 확인창.
 *
 * ⚠️ 모양(원형 아이콘 배지 + 가운데 정렬 헤더 + 요약 박스)은 결제 완료 창
 *    (`features/billing/components/payment-done-dialog.tsx`)의 톤을 그대로 가져온다.
 *    다만 그건 **결과를 알리는** 창이라 버튼이 하나지만, 이건 **되돌릴 수 없는 조작을
 *    미리 확인받는** 창이라 예/아니오 두 버튼이 필요하다 — 그래서 공용 `SuccessDialog`를
 *    쓰지 않고 같은 시각 언어를 `Dialog` 프리미티브로 새로 짠다(CLAUDE.md §토스트:
 *    파괴적 작업은 Dialog로 확인, `SuccessDialog`는 확인창에 쓰지 않는다).
 */
export function NoticeMailDialog({
  target,
  onCancel,
  onConfirm,
  isPending,
}: NoticeMailDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="gap-0 p-8 sm:max-w-[420px]">
        <DialogHeader className="items-center gap-5 text-center">
          <span
            className="border-border flex size-[68px] items-center justify-center rounded-full border"
            aria-hidden
          >
            <Mail className="text-foreground size-6" />
          </span>

          <span className="flex flex-col items-center gap-2">
            <DialogTitle className="text-xl leading-[26px] font-semibold tracking-[-0.4px]">
              안내 메일을 보낼까요?
            </DialogTitle>
            <DialogDescription className="text-center text-[13px] leading-[21px] break-keep">
              미납 안내 이메일이 담당자에게 발송돼요.
            </DialogDescription>
          </span>
        </DialogHeader>

        {target && (
          <dl className="border-border mt-5 flex flex-col gap-2.5 rounded-lg border p-4 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">기업명</dt>
              <dd>{target.companyName}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">담당자 이메일</dt>
              <dd>{target.ownerEmail}</dd>
            </div>
          </dl>
        )}

        <DialogFooter className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            아니오
          </Button>
          <Button
            type="button"
            onClick={() => target && onConfirm(target.companyId)}
            disabled={isPending}
          >
            {isPending ? "발송 중…" : "예"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
