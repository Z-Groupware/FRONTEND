"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POSITION_ROLES, ROLE_LABEL } from "@/constants/domain";
import { cn } from "@/lib/utils";

import type { AssignableRole } from "../types";

interface RoleSelectProps {
  value: AssignableRole;
  onChange: (role: AssignableRole) => void;
  /** 스크린리더용 이름 — 어느 직급의 권한인지 알려준다 */
  label: string;
  className?: string;
}

/** 직급 한 줄의 권한 선택. 폭을 고정해 어떤 권한이든 크기가 같다. */
export function RoleSelect({ value, onChange, label, className }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as AssignableRole)}>
      <SelectTrigger
        aria-label={label}
        className={cn("h-7 w-[92px] justify-between px-2 text-xs leading-none", className)}
      >
        {/* 원본 값(LEADER)이 아니라 표기용 라벨(Leader)을 보여준다 */}
        <SelectValue>{(role) => ROLE_LABEL[role as AssignableRole]}</SelectValue>
      </SelectTrigger>

      {/*
        `alignItemWithTrigger={false}` — 켜두면 고른 항목이 트리거 위로 겹쳐 올라온다.
        끄면 트리거 아래로만 펼쳐진다.
      */}
      <SelectContent
        side="bottom"
        align="start"
        sideOffset={4}
        alignItemWithTrigger={false}
        // 기본 min-w-36이 트리거보다 넓다 — 칸 폭에 맞춘다
        className="w-[92px] min-w-0"
      >
        {POSITION_ROLES.map((role) => (
          <SelectItem key={role} value={role} className="text-xs">
            {ROLE_LABEL[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
