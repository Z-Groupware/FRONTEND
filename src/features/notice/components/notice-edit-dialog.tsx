"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
 * ⚠️ 상세 화면(`notice-detail.tsx`)은 서버 컴포넌트라 자동으로 다시 그려지지 않는다 — 성공하면
 *    `router.refresh()`로 최신 값을 다시 받아온다(`revalidatePath`가 이미 캐시를 무효화해 뒀다).
 */
export function NoticeEditDialog({ notice }: NoticeEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
        <Pencil aria-hidden />
        {LABEL.trigger}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          // ⚠️ 제출 중엔 Esc·바깥 클릭으로 안 닫는다 — 요청은 계속 가는데 화면만 사라지면
          //    결과를 못 본다(`notice-form.tsx`의 `onPendingChange` 참고).
          if (!next && isSubmitting) return;
          setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{LABEL.dialogTitle}</DialogTitle>
          </DialogHeader>

          <NoticeForm
            action={updateNoticeAction}
            notice={notice}
            submitLabel={LABEL.submitLabel}
            onCancel={() => setOpen(false)}
            onPendingChange={setIsSubmitting}
            onSuccess={(updated) => {
              setOpen(false);
              router.refresh();
              toast.success(LABEL.successToast(updated.title));
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
