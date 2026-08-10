"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTION_DELAYED_LABEL, ACTION_STATUS_LABEL, isDelayed } from "@/constants/domain";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { TeamHandoverAction, TeamMemberOption } from "../types";

interface TeamHandoverActionChipProps {
  action: TeamHandoverAction;
  teammates: TeamMemberOption[];
  assignedTo: number | null;
  onAssign: (assigneeId: number) => void;
}

/**
 * 배정할 액션 한 줄 — `<Select>`로 담당자를 고른다.
 * ⚠️ **드래그 앤 드롭이 아니다**(2026-08-09 디자인 리뷰로 제거) — 배정한 항목이 이
 *    목록에도, 별도 팀원 보드에도 동시에 남아 보여 어디에 배정됐는지 헷갈렸다. `<Select>`
 *    값 하나가 배정 상태를 그대로 보여주는 편이 더 명확하다.
 */
export function TeamHandoverActionChip({
  action,
  teammates,
  assignedTo,
  onAssign,
}: TeamHandoverActionChipProps) {
  const color = pickPaletteColor(action.projectTag);
  const delayed = isDelayed(action);
  const assignedName = teammates.find((teammate) => teammate.id === assignedTo)?.name;

  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="w-fit shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
          style={{ backgroundColor: color.bgColor, color: color.textColor }}
        >
          {action.projectTag}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px]">{action.title}</span>
        <span
          className={cn(
            "shrink-0 rounded border px-1.5 py-0.5 text-[11px] leading-4",
            delayed
              ? "border-destructive/40 text-destructive"
              : "border-border text-muted-foreground",
          )}
        >
          {delayed ? ACTION_DELAYED_LABEL : ACTION_STATUS_LABEL[action.status]}
        </span>
        <time
          dateTime={action.dueDate}
          className="text-muted-foreground w-20 shrink-0 text-right text-[12px] tabular-nums"
        >
          {formatMonthDayWeekday(action.dueDate)}
        </time>
      </div>

      <Select
        value={assignedTo !== null ? String(assignedTo) : ""}
        onValueChange={(value) => value && onAssign(Number(value))}
      >
        <SelectTrigger aria-label={`${action.title} 담당자 배정`} className="w-32 shrink-0">
          <SelectValue placeholder="담당자 배정">{() => assignedName ?? "담당자 배정"}</SelectValue>
        </SelectTrigger>
        <SelectContent side="bottom" alignItemWithTrigger={false}>
          {teammates.map((teammate) => (
            <SelectItem key={teammate.id} value={String(teammate.id)}>
              {teammate.name}
              {teammate.roleLabel ? ` · ${teammate.roleLabel}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
