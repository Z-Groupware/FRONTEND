"use client";

import {
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
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

interface ActiveOverlayRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * 지금 걸린 화면 배율(`--app-scale`, 마이페이지 §appearance) — 1이면 안 걸려 있는 것과 같다.
 * ⚠️ **왜 필요한가**: `body`가 그 배율만큼 `transform: scale()`돼 있고(globals.css), 그 안의
 *    `position: fixed`는 실좌표가 아니라 그 축소된 `body` 기준으로 다시 한 번 축소돼 그려진다
 *    (2026-08-09 디자인 리뷰에서 실측 — 75%일 때 커서와 사본 위치가 어긋나고 카드도 더
 *    작아지던 문제). `getBoundingClientRect()`로 잰 값은 이미 그 축소를 한 번 반영한
 *    "화면에 보이는" 값이라, 같은 `body` 안에 `fixed`로 다시 그리면 배율이 **두 번** 걸린다 —
 *    `1/배율`을 곱해 먼저 부풀려 두면 `body`의 축소를 거친 뒤 원래 크기·위치로 돌아온다.
 *    `body` 자신도 `width/height: calc(100% / var(--app-scale))`로 똑같은 방식을 쓴다.
 */
function readAppScale(): number {
  if (typeof window === "undefined") return 1;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--app-scale").trim();
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * 보드 칸반 — 드래그로 칸을 옮기고 [저장하기]를 눌러야 실제로 반영된다.
 * ⚠️ 드래그 자체는 로컬 상태만 바꾼다(낙관적 미리보기) — 서버 반영은 확인 창을 거친 뒤
 *    [확인]을 눌러야 `commitBoardChangesAction`이 불린다.
 * ⚠️ **`<DragOverlay>`를 안 쓴다.** dnd-kit 기본 오버레이는 `body`(화면 배율의 `transform`
 *    기준점) 안에 그대로 그려져 위 배율 문제를 그대로 겪는다 — 직접 `position: fixed` div로
 *    띄우고 좌표를 손으로 보정한다(`readAppScale` 참고).
 */
export function BoardView({ boardType, cards, todayIso }: BoardViewProps) {
  const today = useMemo(() => new Date(`${todayIso}T00:00:00`), [todayIso]);
  // 카드 id → 드래그로 옮긴 칸. 없으면 날짜로 계산한 원래 칸을 그대로 쓴다.
  const [overrides, setOverrides] = useState<Record<number, BoardColumnId>>({});
  const [activeInvalidTarget, setActiveInvalidTarget] = useState<BoardColumnId | null>(null);
  /** 지금 손에 들려 있는 카드 id — 오버레이에 띄울 사본을 찾는 용도. */
  const [activeId, setActiveId] = useState<number | null>(null);
  /** 집어든 순간 원본 카드의 실제 위치·크기 — 오버레이의 시작 자리·크기로 그대로 쓴다. */
  const [activeRect, setActiveRect] = useState<ActiveOverlayRect | null>(null);
  /** 집어든 뒤 커서가 움직인 만큼(px) — `onDragMove`가 매번 갱신한다. */
  const [activeDelta, setActiveDelta] = useState({ x: 0, y: 0 });
  /** 이 드래그 동안 쓸 배율 — 집어든 순간 한 번만 읽는다(드래그 중에 안 바뀐다). */
  const [activeScale, setActiveScale] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function columnOf(card: BoardCard): BoardColumnId {
    return overrides[card.id] ?? getBoardColumn(card, today);
  }

  const groups: Record<BoardColumnId, BoardCard[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const card of cards) groups[columnOf(card)].push(card);

  const changeCount = Object.keys(overrides).length;
  const activeCard = cards.find((card) => card.id === activeId) ?? null;

  function resetActiveDrag() {
    setActiveId(null);
    setActiveRect(null);
    setActiveDelta({ x: 0, y: 0 });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
    setActiveDelta({ x: 0, y: 0 });
    setActiveScale(readAppScale());
    const rect = event.active.rect.current.initial;
    setActiveRect(
      rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null,
    );
  }

  function handleDragMove(event: DragMoveEvent) {
    setActiveDelta({ x: event.delta.x, y: event.delta.y });
  }

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
    resetActiveDrag();
    if (!event.over) return;
    const card = cards.find((c) => c.id === event.active.id);
    if (!card) return;
    const from = columnOf(card);
    const to = event.over.id as BoardColumnId;
    if (from === to) return;
    if (!canMoveCard(from, to)) {
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

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={resetActiveDrag}
      >
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

      {/*
        ⚠️ `DndContext` 바깥이어도 상관없다 — `position: fixed`라 문서 흐름과 무관하게
           떠 있고, 좌표는 전부 `activeRect`/`activeDelta`로 직접 계산한다.
      */}
      {activeCard && activeRect && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[999]"
          style={{
            top: activeRect.top / activeScale,
            left: activeRect.left / activeScale,
            width: activeRect.width / activeScale,
            height: activeRect.height / activeScale,
            transform: `translate3d(${activeDelta.x / activeScale}px, ${activeDelta.y / activeScale}px, 0)`,
          }}
        >
          <BoardCardOverlay card={activeCard} isDelayed={isCardDelayed(activeCard, today)} />
        </div>
      )}

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
