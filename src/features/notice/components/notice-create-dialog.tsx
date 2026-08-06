"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NOTICE_ACTION, NOTICE_ACTION_LABEL } from "@/constants/notice";

import { createNoticeAction } from "../actions";
import { NoticeForm } from "./notice-form";

const LABEL = NOTICE_ACTION_LABEL[NOTICE_ACTION.CREATE];

/**
 * "새 공지" 트리거 + 작성 모달 — 페이지(`/app/notice/new`) 대신 모달로 연다
 * (`add-todo-dialog.tsx`와 같은 패턴, 전용 라우트를 두지 않는다).
 * ⚠️ 목록(`notice-list.tsx`)은 서버 컴포넌트라 성공 뒤 `router.refresh()`로 다시 받아온다
 *    (`revalidatePath`가 이미 캐시를 무효화해 뒀다).
 */
export function NoticeCreateDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button type="button" size="sm" variant="ink" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
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
            action={createNoticeAction}
            submitLabel={LABEL.submitLabel}
            onCancel={() => setOpen(false)}
            onPendingChange={setIsSubmitting}
            onSuccess={(notice) => {
              setOpen(false);
              router.refresh();
              toast.success(LABEL.successToast(notice.title));
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
