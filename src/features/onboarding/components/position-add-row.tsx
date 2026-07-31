"use client";

import { Plus } from "lucide-react";

import { Input } from "@/components/ui/input";

import type { AssignableRole } from "../types";
import { RoleSelect } from "./role-select";

interface PositionAddRowProps {
  name: string;
  role: AssignableRole;
  onNameChange: (name: string) => void;
  onRoleChange: (role: AssignableRole) => void;
  onSubmit: () => void;
}

/** 카드 하단 — 직급 추가 줄(이름 + 권한). */
export function PositionAddRow({
  name,
  role,
  onNameChange,
  onRoleChange,
  onSubmit,
}: PositionAddRowProps) {
  return (
    <div className="border-border bg-muted flex h-[54px] shrink-0 items-center gap-2 border-t px-4">
      <label htmlFor="new-position" className="sr-only">
        직급명
      </label>
      <Input
        id="new-position"
        value={name}
        placeholder="직급명 입력 (Enter)"
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="h-8 flex-1 rounded-md border border-dashed bg-transparent px-2.5 text-[13px]"
      />
      <RoleSelect value={role} onChange={onRoleChange} label="새 직급 권한" className="h-8" />
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
