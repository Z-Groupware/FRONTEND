"use client";

import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
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
  BOARD_COLUMN,
  BOARD_COLUMN_LABEL,
  BOARD_COLUMNS,
  type BoardCard,
  type BoardChange,
  type BoardColumnId,
  type BoardType,
} from "../types";
import { BoardCardOverlay } from "./board-card";
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
  /** 지금 손에 들려 있는 카드 id — `DragOverlay`에 띄울 사본을 찾는 용도. */
  const [activeId, setActiveId] = useState<number | null>(null);
  /**
   * 집어든 순간 원본 카드의 실제 폭(px) — `DragOverlay`는 내용 크기에 맞춰 저절로
   * 좁아지므로, 원본과 같은 폭을 직접 지정해 줘야 "같은 카드를 들고 있다"로 보인다
   * (2026-08-09 디자인 리뷰 — 사본이 원본보다 좁아 보이던 문제).
   */
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function columnOf(card: BoardCard): BoardColumnId {
    return overrides[card.id] ?? getBoardColumn(card, today);
  }

  /**
   * 서버에 실제로 저장된 칸 — override를 무시한다.
   * ⚠️ **드래그 유효성은 항상 이 값 기준으로 본다**, 화면에 보이는 `columnOf`(override 포함) 기준이
   *    아니다(2026-08-11 버그 수정). override 기준으로 검사하면 두 가지 문제가 있었다:
   *    ① 할일→진행중으로 옮긴 걸 다시 할일로 되돌리려 하면 "진행중→할일은 금지"에 걸려 막혔다 —
   *       원본과 같은 칸으로 돌아가는 건 사실 아무것도 안 바뀐 것인데 금지 규칙이 잘못 적용됨.
   *    ② 할일→진행중→완료를 드래그 두 번으로 이으면 로컬에서는 통과됐지만, 저장 시 서버는
   *       "할일→완료 직행"으로 보고 거부했다(서버는 마지막 상태만 본다) — 잠재 버그였다.
   *    원본 기준으로 보면 되돌리기는 항상 허용(같은 칸)되고, 두 번째 문제도 드래그 시점에
   *    바로 막혀서 저장 실패로 이어지지 않는다.
   */
  function originalColumnOf(card: BoardCard): BoardColumnId {
    return getBoardColumn(card, today);
  }

  const groups: Record<BoardColumnId, BoardCard[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const card of cards) groups[columnOf(card)].push(card);

  const changeCount = Object.keys(overrides).length;
  const activeCard = cards.find((card) => card.id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
    setActiveWidth(event.active.rect.current.initial?.width ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    if (!event.over) {
      setActiveInvalidTarget(null);
      return;
    }
    const card = cards.find((c) => c.id === event.active.id);
    const targetColumn = event.over.id as BoardColumnId;
    if (!card) return;
    setActiveInvalidTarget(canMoveCard(originalColumnOf(card), targetColumn) ? null : targetColumn);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveInvalidTarget(null);
    setActiveId(null);
    setActiveWidth(null);
    if (!event.over) return;
    const card = cards.find((c) => c.id === event.active.id);
    if (!card) return;
    const to = event.over.id as BoardColumnId;
    if (columnOf(card) === to) return; // 화면에 이미 보이는 칸으로 또 놓은 것 — 아무것도 안 한다.

    const originalColumn = originalColumnOf(card);
    if (originalColumn === to) {
      // 원래 있던 칸으로 되돌아왔다 — 실제로는 변경이 없는 것이니 override를 지운다.
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
      return;
    }
    if (!canMoveCard(originalColumn, to)) {
      toast.error("여기로는 옮길 수 없습니다");
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
      /*
        ⚠️ **요청 수가 아니라 반영 수를 말한다.** 카드가 그 사이 사라졌거나 옮길 수 없는 칸이면
           액션이 조용히 건너뛴다 — 요청 수를 그대로 적으면 안 옮겨진 것까지 옮겼다고 말한다.
        ⚠️ **던지는 경우도 잡는다.** 돌려주는 실패 값만 보면 Server Action이 reject될 때
           아무 말도 없이 창만 닫힌다 — 사용자는 저장된 줄 안다(§정직성).
      */
      try {
        const { appliedCount } = await commitBoardChangesAction(boardType, changes);
        setOverrides({});
        setConfirmOpen(false);

        if (appliedCount === 0) {
          toast.error("옮기지 못했습니다");
          return;
        }
        toast.success(`${appliedCount}건 반영했습니다`);
      } catch {
        setConfirmOpen(false);
        toast.error("옮기지 못했습니다");
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/*
        ⚠️ **빈 줄에 안내를 둔다.** 버튼 하나만 오른쪽 끝에 떠 있어 그 줄이 통째로 비었고,
           무엇보다 **드래그가 곧 저장이 아니라는 것**을 화면이 말하지 않았다 — 옮겨 놓고
           나가면 되돌아간다(§보드는 저장 전 미리보기).
        ⚠️ 옮긴 게 없으면 문구도 없다. 늘 떠 있으면 안내가 아니라 배경이 된다.
      */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="text-muted-foreground text-[12px] leading-4">
          {changeCount > 0 ? "옮긴 뒤 [저장하기]를 눌러야 반영됩니다." : ""}
        </p>
        <Button
          size="sm"
          disabled={changeCount === 0}
          onClick={() => setConfirmOpen(true)}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          저장하기{changeCount > 0 ? ` (${changeCount})` : ""}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setActiveWidth(null);
        }}
      >
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
          {BOARD_COLUMNS.map((columnId) => (
            <BoardColumn
              key={columnId}
              id={columnId}
              label={BOARD_COLUMN_LABEL[columnId]}
              cards={groups[columnId]}
              /*
                ⚠️ **지금 서 있는 칸으로 판정한다**(2026-08-11 고침). `card.isDone`은 저장된 값이라,
                   지연된 카드를 `완료`로 끌어다 놓아도 배지가 그대로 `지연`이었다 — 보드는
                   저장 전 미리보기 화면이라 눈에 보이는 자리와 배지가 어긋나면 안 된다.
              */
              isDelayed={(card) =>
                columnOf(card) !== BOARD_COLUMN.DONE && isCardDelayed(card, today)
              }
              isInvalidTarget={activeInvalidTarget === columnId}
            />
          ))}
        </div>

        {/* ⚠️ 포털로 최상단에 그린다 — 칼럼의 overflow-y-auto에 안 잘린다(2026-08-09 디자인 리뷰). */}
        <DragOverlay>
          {activeCard && (
            <div style={{ width: activeWidth ?? undefined }}>
              <BoardCardOverlay card={activeCard} isDelayed={isCardDelayed(activeCard, today)} />
            </div>
          )}
        </DragOverlay>
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
