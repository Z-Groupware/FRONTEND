"use client";

import { Plus } from "lucide-react";

import { Input } from "@/components/ui/input";

import { MAX_ORG_NAME_LENGTH } from "../types";

interface DepartmentAddRowProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** 카드 하단 — 부서 추가 줄. 역할은 부서를 만든 뒤 그 안에 넣는다. */
export function DepartmentAddRow({ value, onChange, onSubmit }: DepartmentAddRowProps) {
  return (
    <div className="border-border bg-muted flex h-[54px] shrink-0 items-center gap-2 border-t px-4">
      <label htmlFor="root-department" className="sr-only">
        부서 이름
      </label>
      <Input
        maxLength={MAX_ORG_NAME_LENGTH}
        id="root-department"
        value={value}
        placeholder="새 부서 이름 (Enter)"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          // 한글 입력 중(조합 중)의 Enter는 글자를 확정하는 키다 — 여기서 처리하면 두 번 등록된다
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="h-8 flex-1 rounded-md border bg-transparent px-2.5 text-xs"
      />
      <button
        type="button"
        onClick={onSubmit}
        className="text-muted-foreground bg-foreground/5 hover:bg-foreground/10 focus-visible:ring-ring flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
      >
        <Plus className="size-3.5" />
        <span className="leading-none">추가</span>
      </button>
    </div>
  );
}
