"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { NoticeFormState } from "../actions";
import type { Notice } from "../types";

interface NoticeFormProps {
  /** 작성이면 `createNoticeAction`, 수정이면 `updateNoticeAction` */
  action: (prev: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;
  /** 수정일 때만 — 기존 값 채우기 + id 전달 */
  notice?: Notice;
  submitLabel: string;
  /** 취소 시 돌아갈 곳 */
  cancelHref: string;
}

/**
 * 공지 작성·수정 폼 — 작성/수정이 같은 폼을 쓴다(입력·검증이 같다).
 *
 * ⚠️ `useActionState`로 서버 액션과 묶는다 — 검증 오류는 서버가 돌려준 걸 칸 밑에 인라인으로 보인다
 *    (토스트가 아니라 §토스트: 폼 검증 오류는 인라인). 성공하면 액션이 `redirect`로 화면을 옮긴다.
 */
export function NoticeForm({ action, notice, submitLabel, cancelHref }: NoticeFormProps) {
  const [state, formAction, isPending] = useActionState(action, { errors: {} });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {notice && <input type="hidden" name="id" value={notice.id} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notice-title">제목</Label>
        <Input
          id="notice-title"
          name="title"
          defaultValue={notice?.title}
          placeholder="공지 제목"
          aria-invalid={Boolean(state.errors.title)}
        />
        {state.errors.title && <p className="text-destructive text-xs">{state.errors.title}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notice-body">내용</Label>
        <textarea
          id="notice-body"
          name="body"
          rows={8}
          defaultValue={notice?.body}
          placeholder="공지 내용을 입력하세요"
          aria-invalid={Boolean(state.errors.body)}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 min-h-[180px] w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3"
        />
        {state.errors.body && <p className="text-destructive text-xs">{state.errors.body}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
          취소
        </Link>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "저장 중…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
