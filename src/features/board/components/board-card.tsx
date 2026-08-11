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
        ⚠️ **색이 모서리를 넉넉히 감싼다**(원뿔 그러데이션 테두리, 2026-08-11). 네 번 고쳐 온
           자리다 — 카드 안에 띄운 막대는 위아래가 뜬 **눈금**, 모서리에 붙인 막대는 곡선에 깎여
           **잘린 것**, 왼쪽 테두리(`border-l`)는 색이 곡선 중간에서 회색으로 **뚝 끊긴** 느낌,
           왼쪽 변을 각지게 한 건 곡선을 잃었다.
        ⚠️ 답은 **테두리 전체를 한 겹으로 두고 그 위에 색을 칠하는 것**이다. `conic-gradient`로
           왼쪽 270°를 중심으로 ±55°를 색으로, 나머지를 테두리색으로 칠하면 색이 위·아래
           모서리 곡선을 **타고 넘어가며** 끊기는 자리 없이 이어진다.
        ⚠️ 경계는 10°씩 **번지게** 둔다. 딱 끊으면 그 지점이 또 "끊긴 자리"로 보인다.
        ⚠️ 안쪽 면은 `padding-box`, 색은 `border-box`다 — 한 요소에 배경 두 겹을 겹쳐
           테두리에만 색이 보이게 하는 방법이다.
      */}
      <ColorEdge tag={card.tagLabel} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
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
 * ⚠️ 라운드는 **20px**이다. 규격(`lg` 10 · `xl` 14 · `2xl` 18)보다 큰 값을 쓰는 이유는 왼쪽
 *    색 막대 때문이다 — 곡선이 커야 얇은 막대(6px) 끝이 둥글게 깎인다(§ColorEdge).
 * ⚠️ 세로 여백을 넉넉히 준다(`py-6`). **띠 길이는 결국 카드 높이다** — 띠만 손봐서는 길어지지
 *    않는다. 두 줄 사이 간격도 함께 벌려 늘어난 높이가 한쪽 여백에만 쏠리지 않게 한다.
 */
const CARD_SHAPE = "border-border bg-card relative flex rounded-[20px] border py-6 pr-4 pl-4";

/** 카드 모서리 반지름(px) — 색 테두리가 곡선을 어디까지 타는지도 이 값으로 정한다 */
const CARD_RADIUS = 20;

/**
 * 왼쪽 색 테두리 — 왼쪽 변을 따라 내려오다 **위·아래 곡선을 끝까지 타고, 직선이 시작되는
 * 자리에서 정확히 끝난다.**
 *
 * ⚠️ 세로 막대로는 이게 안 된다. 곧은 막대를 카드가 깎으면 곡선의 **절반쯤에서 멈춘다** —
 *    폭 4px짜리 막대는 곡선이 x=4에 닿는 높이까지만 살아남기 때문이다(반지름 20이면 위에서
 *    8px 지점). 곡선을 끝까지 타려면 막대가 아니라 **곡선을 따라 도는 선**이어야 한다.
 * ⚠️ 그래서 카드와 똑같은 둥근 테두리를 한 겹 더 얹고, 왼쪽 `CARD_RADIUS`만큼만 남기게
 *    잘라낸다(`clip-path`). 자르는 폭이 반지름과 같으므로 색은 곡선이 끝나는 바로 그 자리,
 *    직선이 시작되기 직전에 끝난다(2026-08-11 확정).
 * ⚠️ `-inset-px`로 한 픽셀 밖에 그린다. 같은 자리에 겹치면 회색 테두리가 비쳐 색이 탁해진다.
 */
function ColorEdge({ tag }: { tag: string }) {
  return (
    <span
      className="pointer-events-none absolute -inset-px border-4"
      style={{
        borderColor: pickPaletteColor(tag).solidColor,
        borderRadius: CARD_RADIUS + 1,
        clipPath: `inset(0 calc(100% - ${CARD_RADIUS}px) 0 0)`,
      }}
      aria-hidden
    />
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
        CARD_SHAPE,
        "cursor-grab transition-shadow hover:shadow-sm active:cursor-grabbing",
        /*
          ⚠️ **내용만 감춘다**(`[&>*]:invisible`). 감싸는 `div`로 숨기면 그 `div`가 카드의
             가로 배치(띠 + 내용)에 끼어들어 **색 띠가 늘어나질 못한다** — 자식에 바로 건다.
        */
        isDragging && "opacity-40 [&>*]:invisible",
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
