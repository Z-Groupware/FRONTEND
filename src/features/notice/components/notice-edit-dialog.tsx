"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { NOTICE_ACTION, NOTICE_ACTION_LABEL } from "@/constants/notice";

import { updateNoticeAction } from "../actions";
import type { Notice } from "../types";
import { NoticeForm } from "./notice-form";

const LABEL = NOTICE_ACTION_LABEL[NOTICE_ACTION.EDIT];

interface NoticeEditDialogProps {
  /** 상세 페이지가 이미 서버에서 받아 온 값 — 모달을 위해 다시 조회하지 않는다 */
  notice: Notice;
}

/**
 * "수정" 트리거 + 수정 모달 — 페이지(`/app/notice/:id/edit`) 대신 모달로 연다.
 * ⚠️ **`ConfirmDialog`를 쓴다**(2026-08-08 정리) — 작성 창(`notice-create-dialog.tsx`)과 같은 이유다.
 * ⚠️ 상세 화면(`notice-detail.tsx`)은 서버 컴포넌트라 자동으로 다시 그려지지 않는다 — 성공하면
 *    `router.refresh()`로 최신 값을 다시 받아온다(`revalidatePath`가 이미 캐시를 무효화해 뒀다).
 */
export function NoticeEditDialog({ notice }: NoticeEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <>
      <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
        <Pencil aria-hidden />
        {LABEL.trigger}
      </Button>

      <ConfirmDialog
        isOpen={open}
        onOpenChange={(next) => {
          // ⚠️ 제출 중엔 Esc·바깥 클릭으로 안 닫는다 — 요청은 계속 가는데 화면만 사라지면 결과를 못 본다
          if (!next && isSubmitting) return;
          setOpen(next);
        }}
        title={LABEL.dialogTitle}
        description={LABEL.dialogDescription}
        confirmLabel={LABEL.submitLabel}
        pendingLabel="저장 중"
        isPending={isSubmitting}
        onConfirm={() => formRef.current?.requestSubmit()}
      >
        <NoticeForm
          action={updateNoticeAction}
          notice={notice}
          submitLabel={LABEL.submitLabel}
          formRef={formRef}
          hideActions
          onCancel={() => setOpen(false)}
          onPendingChange={setIsSubmitting}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
            toast.success(LABEL.successToast());
          }}
        />
      </ConfirmDialog>
    </>
  );
}
