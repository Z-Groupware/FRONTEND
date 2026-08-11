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
        "border-border bg-secondary/30 flex h-full min-h-0 flex-col rounded-2xl border p-3 transition-all",
        isOver &&
          (isInvalidTarget
            ? /*
                ⚠️ **못 놓는 자리는 점선이다**(2026-08-10). 실선 테두리에 옅은 빨강만 깔았더니
                   "여기가 지금 대상"과 "여기는 안 된다"가 같은 생김새라, 색이 조금 붉은지
                   눈여겨봐야 알 수 있었다 — **끊긴 선**은 색을 못 보는 사람에게도 막힌 자리로
                   읽힌다(§DESIGN 5: 색 하나로만 알리지 않는다).
                ⚠️ 빨강은 **토큰(`--destructive`)을 옅게** 쓴다. 진한 경고색을 그대로 두면
                   드래그 중 화면 절반이 빨개져 에러가 난 것처럼 보인다.
                ⚠️ **커지지 않는다.** 받아 주는 칸만 살짝 커져야 그 차이가 뜻을 갖는다.
              */
              "border-destructive/45 bg-destructive/[0.04] border-2 border-dashed"
            : // ⚠️ 점선(두껍게)+살짝 확대 — "여기로 옮기려는 중"이 배경색 하나보다 분명하게 보이도록(2026-08-09 디자인 리뷰).
              "border-foreground/60 bg-secondary/60 scale-[1.02] border-2 border-dashed"),
      )}
    >
      {/*
        ⚠️ **머리 밑에 선을 긋는다**(2026-08-10). 제목과 카드가 같은 여백으로 붙어 있어 첫 카드가
           그 칸의 제목처럼 읽혔다 — 선 하나면 "여기부터가 이 칸에 든 것"이 눈에 바로 들어온다.
        ⚠️ 선은 칸 폭 끝까지 뺀다(`-mx-3`). 안쪽에만 그으면 칸을 가르는 선이 아니라
           제목에 딸린 밑줄로 보인다(공지·회의 카드가 쓰는 해부와 같다).
        ⚠️ 못 놓는 자리일 때는 선도 같이 붉어진다 — 칸 전체가 한 상태로 읽혀야 한다.
      */}
      <div
        className={cn(
          "-mx-3 flex shrink-0 items-center justify-between border-b px-4 pb-2.5",
          isOver && isInvalidTarget ? "border-destructive/25" : "border-border",
        )}
      >
        {/* 글자는 다섯 크기다(DESIGN §4) — `text-sm`·`text-xs`는 규격 밖이라 13px·12px로 맞춘다 */}
        <h3 className="text-[13px] leading-5 font-semibold">{label}</h3>
        <span className="text-muted-foreground text-[12px] leading-4 tabular-nums">
          {cards.length}
        </span>
      </div>

      <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pt-3">
        {cards.length === 0 ? (
          <p className="text-muted-foreground flex h-20 items-center justify-center text-[12px] leading-4">
            해당 항목이 없습니다
          </p>
        ) : (
          cards.map((card) => <BoardCard key={card.id} card={card} isDelayed={isDelayed(card)} />)
        )}
      </div>
    </div>
  );
}
