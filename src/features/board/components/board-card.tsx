"use client";

import { useDraggable } from "@dnd-kit/core";

import { ProjectTag } from "@/components/common/project-tag";
import { StatusDot } from "@/components/common/status-dot";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
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
        ⚠️ **왼쪽에 프로젝트 색 띠를 세운다**(2026-08-11). 카드가 흰 상자로 줄줄이 쌓이니 전부
           같은 무게로 읽혀 훑을 때 눈에 안 걸렸다 — 색 한 줄이 카드마다 다른 표식이 되어
           같은 프로젝트끼리 세로로 이어 보인다(검색 `최근 본 항목`·둘러보기와 같은 방식).
        ⚠️ **칩과 겹치는 게 아니다.** 칩은 어느 프로젝트인지(글자), 띠는 훑을 때 걸리는
           표식(색)이다 — 눈은 글자를 읽기 전에 색을 먼저 본다.
        ⚠️ 색은 **태그 이름에서 나온다**(`pickPaletteColor`) — 어느 화면에서든 같은 프로젝트는
           같은 색이다. 상태색(회색·초록·보라)과 다른 팔레트라 뜻이 섞이지 않는다.
        ⚠️ `h-full`은 부모 높이가 auto라 0이 된다 — 늘어나야 하므로 `self-stretch`다.
      */}
      <span
        className="w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: pickPaletteColor(card.tagLabel).solidColor }}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {/*
        ⚠️ **제목이 먼저다.** 칩·제목·날짜를 세 층으로 쌓아 두니 카드가 필요 이상으로 길고,
           셋 다 왼쪽 끝에 붙어 오른쪽이 통째로 비었다 — 카드에서 읽는 건 **무슨 일인가**이고
           태그·마감은 그 곁 정보다.
        ⚠️ 글자는 다섯 크기다(DESIGN §4). `text-sm`(14px)·`text-xs`(12px)는 규격 밖이라
           13px·12px로 맞춘다.
      */}
        <p className="text-foreground text-[13px] leading-5 font-medium break-keep">{card.title}</p>

        {/*
        ⚠️ **곁 정보는 한 줄에 좌우로 벌린다.** 왼쪽은 어느 프로젝트인지, 오른쪽은 언제까지인지 —
           축을 가르면(DESIGN §3) 카드가 한 층 짧아지고 폭도 다 쓴다.
        ⚠️ 공용 칩을 쓴다(`components/common/project-tag`). 여기만 손으로 그린 칩이라 같은
           프로젝트가 회의·검색·보드에서 저마다 다른 모양으로 떴다.
      */}
        <div className="flex items-center justify-between gap-2">
          <ProjectTag tag={card.tagLabel} />
          {isDelayed ? (
            <StatusDot tone="DELAYED" label="지연" className="text-[12px] leading-4 font-medium" />
          ) : (
            <span className="text-muted-foreground text-[12px] leading-4 tabular-nums">
              {due ? `${due}까지` : "-"}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * 카드 겉모양 — 실제 카드와 사본이 같은 값을 쓴다.
 *
 * ⚠️ 라운드는 `rounded-xl`(14px)이다. `2xl`(18px)은 화면을 나누는 **큰 카드**의 값이고,
 *    이건 칸 안에 줄지어 서는 작은 카드라 한 단계 작다(검색 화면과 같은 규칙).
 */
const CARD_SHAPE =
  "border-border bg-card flex items-stretch gap-3 rounded-xl border py-3.5 pr-4 pl-3";

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
        /*
          ⚠️ **내용만 감춘다**(`[&>*]:invisible`). 감싸는 `div`로 숨기면 그 `div`가 카드의
             가로 배치(띠 + 내용)에 끼어들어 **색 띠가 늘어나질 못한다** — 자식에 바로 건다.
        */
        isDragging && "border-dashed bg-transparent [&>*]:invisible",
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
    <div className={cn(CARD_SHAPE, "cursor-grabbing shadow-lg")}>
      <BoardCardBody card={card} isDelayed={isDelayed} />
    </div>
  );
}
