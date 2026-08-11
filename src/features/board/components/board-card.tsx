"use client";

import { useDraggable } from "@dnd-kit/core";

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
 * ⚠️ **드래그 중엔 내용을 비운 빈 자리만 남긴다** — 실제로 손에 들려 움직이는 모습은
 *    `BoardCardOverlay`가 `DragOverlay`로 따로 그린다. 처음엔 원본에 반투명 내용을 그대로
 *    두고 `transform`까지 얹었더니, 사본과 원본이 같이 움직여 겹쳐 보이는 "반사"처럼
 *    보였다(2026-08-09 디자인 리뷰) — 원본은 **제자리에 고정된 빈 칸**으로만 남기고
 *    (transform 제거, 내용 숨김), 움직이는 건 사본 하나뿐이어야 한다.
 */
export function BoardCard({ card, isDelayed }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "border-border bg-card flex cursor-grab flex-col gap-2 rounded-2xl border p-4 active:cursor-grabbing",
        isDragging && "border-dashed bg-transparent",
      )}
    >
      <div className={cn("flex flex-col gap-2", isDragging && "invisible")}>
        <BoardCardBody card={card} isDelayed={isDelayed} />
      </div>
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
