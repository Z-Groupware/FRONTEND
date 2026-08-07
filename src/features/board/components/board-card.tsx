"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { StatusDot } from "@/components/common/status-dot";
import { formatMonthDayWeekday } from "@/lib/date";
import { cn } from "@/lib/utils";

import type { BoardCard as BoardCardModel } from "../types";

interface BoardCardProps {
  card: BoardCardModel;
  isDelayed: boolean;
}

/** 보드 카드 한 장 — 드래그 핸들은 카드 전체(클릭해서 상세로 이동하는 화면이 아니라 옮기는 화면). */
export function BoardCard({ card, isDelayed }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });
  const due = formatMonthDayWeekday(card.dueDate);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "border-border bg-card flex cursor-grab flex-col gap-2 rounded-2xl border p-4 active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <span
        className="w-fit rounded px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold"
        style={{ backgroundColor: card.tagBgColor, color: card.tagTextColor }}
      >
        {card.tagLabel}
      </span>
      <p className="text-foreground text-sm font-medium">{card.title}</p>
      {isDelayed ? (
        <StatusDot tone="DELAYED" label="지연" className="text-xs" />
      ) : (
        <p className="text-muted-foreground text-xs tabular-nums">{due ? `${due}까지` : "-"}</p>
      )}
    </div>
  );
}
