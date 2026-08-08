"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { NOTICE_ACTION, NOTICE_ACTION_LABEL } from "@/constants/notice";

import { createNoticeAction } from "../actions";
import { NoticeForm } from "./notice-form";

const LABEL = NOTICE_ACTION_LABEL[NOTICE_ACTION.CREATE];

/**
 * "새 공지" 트리거 + 작성 모달 — 페이지(`/app/notice/new`) 대신 모달로 연다
 * (`add-todo-dialog.tsx`와 같은 패턴, 전용 라우트를 두지 않는다).
 *
 * ⚠️ **`ConfirmDialog`를 쓴다**(2026-08-08 정리). 전에는 `Dialog`를 직접 조립해 480px로 열었는데,
 *    창마다 폭이 갈렸고(420·480·640·720) 설명이 없어 스크린리더가 제목만 읽었다.
 * ⚠️ 실행 버튼은 **창**이 그린다 — 폼은 버튼을 감추고(`hideActions`) 창이 `requestSubmit()`으로
 *    제출을 건다. `useActionState`는 폼이 그대로 들고 있어야 검증 오류가 칸 밑에 남는다.
 * ⚠️ 목록(`notice-list.tsx`)은 서버 컴포넌트라 성공 뒤 `router.refresh()`로 다시 받아온다
 *    (`revalidatePath`가 이미 캐시를 무효화해 뒀다).
 */
export function NoticeCreateDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <>
      <Button type="button" size="sm" variant="ink" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
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
          action={createNoticeAction}
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
