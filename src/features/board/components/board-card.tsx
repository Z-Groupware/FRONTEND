"use client";

import { useDraggable } from "@dnd-kit/core";

import { ProjectTag } from "@/components/common/project-tag";
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
      {/*
        ⚠️ **공용 칩을 쓴다**(`components/common/project-tag`). 여기만 손으로 그린
           `font-mono text-[10px]` 칩이라 같은 프로젝트가 회의·검색·보드에서 저마다 다른
           모양으로 떴다 — 칩은 프로젝트를 알아보는 표식이라 모양이 흔들리면 표식 노릇을 못 한다.
      */}
      <ProjectTag tag={card.tagLabel} />
      {/*
        ⚠️ 글자는 다섯 크기다(DESIGN §4). `text-sm`(14px)·`text-xs`(12px)는 규격 밖이라
           13px·12px로 맞춘다 — 한 화면에 여섯째 크기가 끼면 어느 것이 기준인지 흐려진다.
      */}
      <p className="text-foreground text-[13px] leading-5 font-medium">{card.title}</p>
      {isDelayed ? (
        <StatusDot tone="DELAYED" label="지연" className="text-[12px] leading-4" />
      ) : (
        <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
          {due ? `${due}까지` : "-"}
        </p>
      )}
    </>
  );
}

/**
 * 카드 겉모양 — 실제 카드와 사본이 같은 값을 쓴다.
 *
 * ⚠️ 라운드는 `rounded-xl`(14px)이다. `2xl`(18px)은 화면을 나누는 **큰 카드**의 값이고,
 *    이건 칸 안에 줄지어 서는 작은 카드라 한 단계 작다(검색 화면과 같은 규칙).
 */
const CARD_SHAPE = "border-border bg-card flex flex-col gap-2 rounded-xl border p-4";

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
        CARD_SHAPE,
        "hover:border-foreground/25 cursor-grab transition-colors active:cursor-grabbing",
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
    <div className={cn(CARD_SHAPE, "cursor-grabbing shadow-lg")}>
      <BoardCardBody card={card} isDelayed={isDelayed} />
    </div>
  );
}
