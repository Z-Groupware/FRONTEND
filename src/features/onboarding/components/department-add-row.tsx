"use client";

import { Plus } from "lucide-react";

import { Input } from "@/components/ui/input";

interface DepartmentAddRowProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** 카드 하단 — 최상위(상위) 부서 추가 줄. */
export function DepartmentAddRow({ value, onChange, onSubmit }: DepartmentAddRowProps) {
  return (
    <div className="border-border bg-muted flex h-[54px] shrink-0 items-center gap-2 border-t px-4">
      <label htmlFor="root-department" className="sr-only">
        상위 부서 이름
      </label>
      <Input
        id="root-department"
        value={value}
        placeholder="상위 부서 추가 (Enter)"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="h-8 flex-1 rounded-md border border-dashed bg-transparent px-2.5 text-[13px]"
      />
      <button
        type="button"
        onClick={onSubmit}
        className="text-muted-foreground bg-foreground/5 hover:bg-foreground/10 focus-visible:ring-ring flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Plus className="size-3.5" />
        추가
      </button>
    </div>
  );
}
