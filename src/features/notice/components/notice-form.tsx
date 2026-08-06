"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
  /** 취소 버튼 — 모달을 닫는다(페이지 이동 아님) */
  onCancel: () => void;
  /** 성공 시 호출 — 생성/수정된 공지를 그대로 받는다(캘린더 `AddTodoDialog`와 같은 패턴) */
  onSuccess: (notice: Notice) => void;
  /**
   * 제출 진행 상태를 부모(모달)에 알린다 — 부모가 이 값을 보고 Esc·바깥 클릭으로 모달이
   * 닫히지 않게 막는다. 진행 중에 닫히면 요청은 계속 가는데 화면만 사라져 결과를 못 본다
   * (`approval-detail-actions.tsx`의 `ConfirmDialog` 처리 중 닫힘 방지와 같은 이유).
   */
  onPendingChange?: (isPending: boolean) => void;
}

/**
 * 공지 작성·수정 폼 — 모달(`NoticeCreateDialog`·`NoticeEditDialog`) 안에서 쓴다.
 *
 * ⚠️ `useActionState`로 서버 액션과 묶는다 — 검증 오류는 서버가 돌려준 걸 칸 밑에 인라인으로 보인다
 *    (토스트가 아니라 §토스트: 폼 검증 오류는 인라인). 성공하면 액션이 돌려준 `notice`를 보고
 *    `onSuccess`를 호출한다 — `redirect`로 페이지를 옮기지 않는다(모달이라 그럴 필요가 없다).
 * ⚠️ 제목·내용 입력을 **직접 추적**한다 — 둘 다 채워지기 전엔 제출 버튼을 잠근다(빈 공지 발행 방지).
 *    `name` 속성은 그대로 둬서 제어 컴포넌트여도 `FormData`엔 정상적으로 값이 실린다.
 */
export function NoticeForm({
  action,
  notice,
  submitLabel,
  onCancel,
  onSuccess,
  onPendingChange,
}: NoticeFormProps) {
  const [state, formAction, isPending] = useActionState(action, { errors: {} });
  const [title, setTitle] = useState(notice?.title ?? "");
  const [body, setBody] = useState(notice?.body ?? "");
  const canSubmit = title.trim().length > 0 && body.trim().length > 0;
  const handledNoticeId = useRef<string | null>(null);

  useEffect(() => {
    if (state.notice && state.notice.id !== handledNoticeId.current) {
      handledNoticeId.current = state.notice.id;
      onSuccess(state.notice);
    }
  }, [state.notice, onSuccess]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {notice && <input type="hidden" name="id" value={notice.id} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notice-title">제목</Label>
        <Input
          id="notice-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
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
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="공지 내용을 입력하세요"
          aria-invalid={Boolean(state.errors.body)}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive min-h-[180px] w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3"
        />
        {state.errors.body && <p className="text-destructive text-xs">{state.errors.body}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="sm" variant="ink" disabled={isPending || !canSubmit}>
          {isPending ? "저장 중…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
