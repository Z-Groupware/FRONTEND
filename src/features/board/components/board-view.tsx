"use client";

import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";

import { commitBoardChangesAction } from "../actions";
import { canMoveCard, getBoardColumn, isCardDelayed } from "../lib";
import {
  BOARD_COLUMN_LABEL,
  BOARD_COLUMNS,
  type BoardCard,
  type BoardChange,
  type BoardColumnId,
  type BoardType,
} from "../types";
import { BoardColumn } from "./board-column";

interface BoardViewProps {
  boardType: BoardType;
  cards: BoardCard[];
  /** 서버가 렌더링한 오늘(로컬 자정 보정은 클라이언트에서 다시 한다). `YYYY-MM-DD`. */
  todayIso: string;
}

/**
 * 보드 칸반 — 드래그로 칸을 옮기고 [저장하기]를 눌러야 실제로 반영된다.
 * ⚠️ 드래그 자체는 로컬 상태만 바꾼다(낙관적 미리보기) — 서버 반영은 확인 창을 거친 뒤
 *    [확인]을 눌러야 `commitBoardChangesAction`이 불린다.
 */
export function BoardView({ boardType, cards, todayIso }: BoardViewProps) {
  const today = useMemo(() => new Date(`${todayIso}T00:00:00`), [todayIso]);
  // 카드 id → 드래그로 옮긴 칸. 없으면 날짜로 계산한 원래 칸을 그대로 쓴다.
  const [overrides, setOverrides] = useState<Record<number, BoardColumnId>>({});
  const [activeInvalidTarget, setActiveInvalidTarget] = useState<BoardColumnId | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function columnOf(card: BoardCard): BoardColumnId {
    return overrides[card.id] ?? getBoardColumn(card, today);
  }

  const groups: Record<BoardColumnId, BoardCard[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const card of cards) groups[columnOf(card)].push(card);

  const changeCount = Object.keys(overrides).length;

  function handleDragOver(event: DragOverEvent) {
    if (!event.over) {
      setActiveInvalidTarget(null);
      return;
    }
    const card = cards.find((c) => c.id === event.active.id);
    const targetColumn = event.over.id as BoardColumnId;
    if (!card) return;
    setActiveInvalidTarget(canMoveCard(columnOf(card), targetColumn) ? null : targetColumn);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveInvalidTarget(null);
    if (!event.over) return;
    const card = cards.find((c) => c.id === event.active.id);
    if (!card) return;
    const from = columnOf(card);
    const to = event.over.id as BoardColumnId;
    if (from === to) return;
    if (!canMoveCard(from, to)) {
      toast("여기로는 옮길 수 없습니다");
      return;
    }
    setOverrides((prev) => ({ ...prev, [card.id]: to }));
  }

  function handleConfirm() {
    const changes: BoardChange[] = Object.entries(overrides).map(([id, toColumn]) => ({
      id: Number(id),
      toColumn,
    }));
    startTransition(async () => {
      await commitBoardChangesAction(boardType, changes);
      setOverrides({});
      setConfirmOpen(false);
      toast(`${changes.length}건 반영했습니다`);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 justify-end">
        <Button
          size="sm"
          disabled={changeCount === 0}
          onClick={() => setConfirmOpen(true)}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          저장하기{changeCount > 0 ? ` (${changeCount})` : ""}
        </Button>
      </div>

      <DndContext sensors={sensors} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
          {BOARD_COLUMNS.map((columnId) => (
            <BoardColumn
              key={columnId}
              id={columnId}
              label={BOARD_COLUMN_LABEL[columnId]}
              cards={groups[columnId]}
              isDelayed={(card) => isCardDelayed(card, today)}
              isInvalidTarget={activeInvalidTarget === columnId}
            />
          ))}
        </div>
      </DndContext>

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="보드 상태를 저장할까요?"
        description={`${changeCount}건의 상태가 지금 보드에 보이는 대로 바뀝니다.`}
        confirmLabel="저장"
        isPending={isPending}
        pendingLabel="저장 중"
        onConfirm={handleConfirm}
      />
    </div>
  );
}
