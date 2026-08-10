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

/** 카드 내용 — 실제 카드와 드래그 중 떠다니는 사본(`BoardCardOverlay`)이 같이 쓴다. */
function BoardCardBody({ card, isDelayed }: BoardCardProps) {
  const due = formatMonthDayWeekday(card.dueDate);
  return (
    <>
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
    </>
  );
}

/**
 * 보드 카드 한 장 — 드래그 핸들은 카드 전체(클릭해서 상세로 이동하는 화면이 아니라 옮기는 화면).
 * ⚠️ **드래그 중엔 이 자리는 옅게 남긴다**(반투명이 아니라 "빈 자리" 표시) — 실제로 손에 들려
 *    움직이는 모습은 `BoardCardOverlay`가 따로 맡는다(2026-08-09 디자인 리뷰: 드래그 중 카드가
 *    흐려지고 다른 카드 뒤로 가려지던 문제 — 칼럼의 `overflow-y-auto`가 인라인 transform을
 *    잘라 먹어서였다. `DragOverlay`로 최상단에 포털 렌더링하면 안 가려진다).
 */
export function BoardCard({ card, isDelayed }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "border-border bg-card flex cursor-grab flex-col gap-2 rounded-2xl border p-4 active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <BoardCardBody card={card} isDelayed={isDelayed} />
    </div>
  );
}

/**
 * 드래그 중 커서를 따라다니는 사본 — `DragOverlay` 안에서만 쓴다.
 * ⚠️ **흐려지지 않는다.** 지금 손에 들고 있는 카드라 원본 카드보다 오히려 진하게(그림자)
 *    보여야 "이걸 옮기는 중"이라는 게 분명하다.
 */
export function BoardCardOverlay({ card, isDelayed }: BoardCardProps) {
  return (
    <div className="border-border bg-card flex cursor-grabbing flex-col gap-2 rounded-2xl border p-4 shadow-lg">
      <BoardCardBody card={card} isDelayed={isDelayed} />
    </div>
  );
}
