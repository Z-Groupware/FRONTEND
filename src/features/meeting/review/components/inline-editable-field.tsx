"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface InlineEditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** 여러 줄 편집(세부 내용) — 평소엔 한 줄로 말줄임, 클릭하면 textarea로 펼쳐진다. */
  multiline?: boolean;
  /** 빈 값 저장을 허용한다 — 세부 내용처럼 선택 항목일 때만 켠다(액션명은 항상 꺼둔다). */
  allowEmpty?: boolean;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}

/**
 * 클릭하면 그 자리에서 바로 고칠 수 있는 텍스트 — 액션명(한 줄 input)·세부 내용(여러 줄
 * textarea) 둘 다 이걸로 쓴다. 연필 아이콘으로 "눌러서 고칠 수 있다"를 알린다.
 * ⚠️ **`allowEmpty`가 꺼져 있으면** 빈 값으로 저장하지 않는다 — 지우고 포커스를 옮기면
 *    원래 값으로 되돌린다(빈 제목 방지). 세부 내용처럼 선택 항목은 지울 수 있어야 한다.
 */
export function InlineEditableField({
  value,
  onChange,
  multiline,
  allowEmpty,
  ariaLabel,
  placeholder,
  className,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function commit() {
    const next = draft.trim();
    onChange(next.length > 0 || allowEmpty ? next : value);
    setIsEditing(false);
  }

  function cancel() {
    setDraft(value);
    setIsEditing(false);
  }

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          aria-label={ariaLabel}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => event.key === "Escape" && cancel()}
          rows={3}
          className={cn(
            "border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-lg border bg-transparent px-2.5 py-1.5 text-[12px] leading-4 outline-none focus-visible:ring-3",
            className,
          )}
        />
      );
    }
    return (
      <input
        autoFocus
        aria-label={ariaLabel}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") cancel();
        }}
        className={cn(
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1 text-[13px] leading-5 font-medium outline-none focus-visible:ring-3",
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      aria-label={`${ariaLabel} 수정`}
      // ⚠️ `inline-flex`(아니라 `flex`)라서 글자 길이만큼만 넓어진다 — 연필이 칸 오른쪽 끝이
      //    아니라 글자 바로 옆에 붙는다. 넘치면 `max-w-full`이 잘라 `truncate`가 말줄임한다.
      className={cn(
        "group inline-flex max-w-full cursor-pointer items-start gap-1 text-left",
        className,
      )}
    >
      <span
        className={cn(
          "min-w-0 truncate",
          multiline
            ? "text-muted-foreground text-[12px] leading-4"
            : "text-[13px] leading-5 font-medium",
          !value && "text-muted-foreground/60",
        )}
      >
        {value || placeholder}
      </span>
      <Pencil
        className="text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 size-3 shrink-0"
        aria-hidden
      />
    </button>
  );
}
