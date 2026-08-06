"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";

import { approveCompanyAction, rejectCompanyAction } from "../actions";

interface ApprovalDetailActionsProps {
  companyId: string;
  companyName: string;
}

type PendingAction = "approve" | "reject" | null;

/**
 * 승인·반려 버튼 — 상세 페이지(`/system/approval/:id`) 전용.
 * ⚠️ 공용 `ConfirmDialog` **하나**를 두 조작이 같이 쓴다(둘 다 되돌리기 어려운 조작이라
 *    확인 없이 바로 실행하지 않는다).
 * ⚠️ 성공하면 **목록으로 돌아간다** — `?done=approve|reject`를 달아 보내고, 그 쪽
 *    (`approval-list.tsx`)이 쿼리를 보고 토스트를 띄운다. 실패하면 이 페이지에 남아 토스트로
 *    알린다(상태가 안 바뀌었으니 옮겨갈 이유가 없다).
 */
export function ApprovalDetailActions({ companyId, companyName }: ApprovalDetailActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const isReject = pendingAction === "reject";

  function handleConfirm() {
    const action = pendingAction;
    if (!action) return;

    startTransition(async () => {
      let success = false;

      try {
        const response =
          action === "approve"
            ? await approveCompanyAction(companyId)
            : await rejectCompanyAction(companyId);
        success = response.success;
      } catch {
        // ⚠️ 미구현(!isMock) 분기 등에서 던진 에러가 여기로 온다 — 조용히 삼키지 않고 실패로 알린다.
        success = false;
      }

      setPendingAction(null);

      if (success) {
        router.push(`/system/approval?done=${action}`);
      } else {
        toast.error(`'${companyName}' 처리에 실패했습니다`);
      }
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setPendingAction("reject")}
      >
        반려
      </Button>
      <Button type="button" variant="ink" onClick={() => setPendingAction("approve")}>
        승인
      </Button>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onOpenChange={(open) => {
          // ⚠️ 처리 중엔 닫지 않는다 — Esc·배경 클릭으로 닫히면 요청은 계속 가는데 화면만
          //    사라져 결과를 못 본다.
          if (!open && !isPending) setPendingAction(null);
        }}
        title={
          isReject ? `'${companyName}' 신청을 반려할까요?` : `'${companyName}' 가입을 승인할까요?`
        }
        description={
          isReject
            ? "반려하면 이 신청은 목록에서 사라지고 되돌릴 수 없습니다."
            : "승인하면 기업 코드가 자동 발급되고 담당자 이메일로 발송됩니다."
        }
        confirmLabel={isReject ? "반려" : "승인"}
        pendingLabel={isReject ? "반려 중" : "승인 중"}
        isDestructive={isReject}
        isPending={isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
