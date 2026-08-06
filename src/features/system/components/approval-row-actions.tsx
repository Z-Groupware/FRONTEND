"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";

import { approveCompanyAction, rejectCompanyAction } from "../actions";

interface ApprovalRowActionsProps {
  companyId: string;
  companyName: string;
  /** 성공하면 목록(무한 스크롤 로컬 상태)에서 그 행을 지운다 */
  onDone: (companyId: string) => void;
}

type PendingAction = "approve" | "reject" | null;

/**
 * 승인·반려 버튼 — 공용 `ConfirmDialog` **하나**를 두 조작이 같이 쓴다(둘 다 되돌리기 어려운
 * 조작이라 확인 없이 바로 실행하지 않는다). 눌린 버튼에 따라 제목·설명·색만 바꾼다.
 * ⚠️ 성공해도 페이지를 옮기지 않는다 — 무한 스크롤 목록이라 `redirect`하면 이어붙인 항목이
 *    전부 날아간다(`../actions.ts`의 `approveCompanyAction` 주석 참고).
 */
export function ApprovalRowActions({ companyId, companyName, onDone }: ApprovalRowActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const isReject = pendingAction === "reject";

  function handleConfirm() {
    const action = pendingAction;
    if (!action) return;

    startTransition(async () => {
      const response =
        action === "approve"
          ? await approveCompanyAction(companyId)
          : await rejectCompanyAction(companyId);

      setPendingAction(null);

      if (response.success) {
        toast.success(`'${companyName}' 기업을 ${action === "approve" ? "승인" : "반려"}했습니다`);
        onDone(companyId);
      } else {
        toast.error(`'${companyName}' 처리에 실패했습니다`);
      }
    });
  }

  return (
    <div className="flex justify-center gap-1.5">
      <Button type="button" variant="outline" size="xs" onClick={() => setPendingAction("approve")}>
        승인
      </Button>
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setPendingAction("reject")}
      >
        반려
      </Button>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
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
