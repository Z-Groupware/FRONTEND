"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

import type { BoardCard as BoardCardModel, BoardColumnId } from "../types";
import { BoardCard } from "./board-card";

interface BoardColumnProps {
  id: BoardColumnId;
  label: string;
  cards: BoardCardModel[];
  isDelayed: (card: BoardCardModel) => boolean;
  /** 지금 드래그 중인 카드가 여기로 못 오면(§canMoveCard) 놓는 순간 시각적으로도 알린다. */
  isInvalidTarget: boolean;
}

export function BoardColumn({ id, label, cards, isDelayed, isInvalidTarget }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-border bg-secondary/30 flex h-full min-h-0 flex-col gap-3 rounded-2xl border p-3 transition-colors",
        isOver && (isInvalidTarget ? "bg-destructive/5 border-destructive/40" : "bg-secondary/60"),
      )}
    >
      <div className="flex shrink-0 items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-muted-foreground text-xs tabular-nums">{cards.length}</span>
      </div>
      <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {cards.length === 0 ? (
          <p className="text-muted-foreground flex h-20 items-center justify-center text-xs">
            해당 항목이 없어요
          </p>
        ) : (
          cards.map((card) => <BoardCard key={card.id} card={card} isDelayed={isDelayed(card)} />)
        )}
      </div>
    </div>
  );
}
