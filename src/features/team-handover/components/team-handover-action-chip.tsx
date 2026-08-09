"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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
 * 배정 대기 액션 칩 — 드래그로도, **`<Select>`로도** 배정할 수 있다.
 * ⚠️ 드래그만 되면 키보드 사용자는 배정할 방법이 없다(CLAUDE.md §a11y "DnD 보드는 키보드
 *    대체 경로 필수") — 이 셀렉트가 그 대체 경로다.
 */
export function TeamHandoverActionChip({
  action,
  teammates,
  assignedTo,
  onAssign,
}: TeamHandoverActionChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
  });
  const color = pickPaletteColor(action.projectTag);
  const delayed = isDelayed(action);
  const assignedName = teammates.find((teammate) => teammate.id === assignedTo)?.name;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "border-border bg-card flex items-center gap-3 rounded-xl border p-3",
        isDragging && "opacity-40",
      )}
    >
      {/*
        ⚠️ **포커스를 안 받는다.** 마우스 드래그 전용 손잡이다 — 키보드 배정은 옆의
           `<Select>`가 맡는다(dnd-kit `PointerSensor`만 붙어 있어 이 손잡이 자체는 키보드로
           작동하지 않는다). `tabIndex`를 주면 아무것도 못 하는 포커스 정지점만 생긴다.
      */}
      <div
        {...listeners}
        {...attributes}
        aria-hidden
        className="flex min-w-0 flex-1 cursor-grab items-center gap-3 active:cursor-grabbing"
      >
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
