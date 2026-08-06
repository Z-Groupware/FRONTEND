"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { createNoticeAction } from "../actions";
import { NoticeForm } from "./notice-form";

/**
 * "새 공지" 트리거 + 작성 모달 — 페이지(`/app/notice/new`) 대신 모달로 연다
 * (`add-todo-dialog.tsx`와 같은 패턴, 전용 라우트를 두지 않는다).
 * ⚠️ 목록(`notice-list.tsx`)은 서버 컴포넌트라 성공 뒤 `router.refresh()`로 다시 받아온다
 *    (`revalidatePath`가 이미 캐시를 무효화해 뒀다).
 */
export function NoticeCreateDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button type="button" size="sm" variant="ink" onClick={() => setOpen(true)}>
        <Plus aria-hidden />새 공지
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>새 공지 작성</DialogTitle>
          </DialogHeader>

          <NoticeForm
            action={createNoticeAction}
            submitLabel="발행"
            onCancel={() => setOpen(false)}
            onSuccess={(notice) => {
              setOpen(false);
              router.refresh();
              toast.success(`'${notice.title}' 공지를 발행했습니다`);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
