"use client";

import { Plus } from "lucide-react";

import { Input } from "@/components/ui/input";

import { type AssignableRole, MAX_ORG_NAME_LENGTH } from "../types";
import { RoleSelect } from "./role-select";

interface PositionAddRowProps {
  name: string;
  role: AssignableRole;
  /** 이미 다른 직급이 가져간 권한 — 리더는 하나뿐이다 */
  blocked: readonly AssignableRole[];
  onNameChange: (name: string) => void;
  onRoleChange: (role: AssignableRole) => void;
  onSubmit: () => void;
}

/** 카드 하단 — 직급 추가 줄(이름 + 권한). */
export function PositionAddRow({
  name,
  role,
  blocked,
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
        maxLength={MAX_ORG_NAME_LENGTH}
        id="new-position"
        value={name}
        placeholder="새 직급 이름 (Enter)"
        onChange={(event) => onNameChange(event.target.value)}
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
      <RoleSelect
        value={role}
        onChange={onRoleChange}
        label="새 직급 권한"
        blocked={blocked}
        size="default"
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
