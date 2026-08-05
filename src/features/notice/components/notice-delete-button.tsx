"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { deleteNoticeAction } from "../actions";

interface NoticeDeleteButtonProps {
  id: string;
  title: string;
}

/**
 * 공지 삭제 — 되돌릴 수 없는 조작이라 확인 Dialog를 먼저 띄운다(CLAUDE.md §토스트: 파괴적 작업은
 * 토스트가 아니라 Dialog로 확인). `department-delete-dialog.tsx`와 같은 패턴이다.
 * ⚠️ 확인을 누르면 **폼 액션**(`deleteNoticeAction`)이 실행되고, 성공하면 액션 안 `redirect`가
 *    목록으로 보낸다.
 */
export function NoticeDeleteButton({ id, title }: NoticeDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => setOpen(true)}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 aria-hidden />
        삭제
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>&lsquo;{title}&rsquo; 공지를 삭제할까요?</DialogTitle>
            <DialogDescription>삭제하면 되돌릴 수 없어요.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <form action={deleteNoticeAction}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit" variant="destructive">
                삭제
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
