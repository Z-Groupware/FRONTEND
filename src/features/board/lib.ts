import { ACTION_STATUS, isDelayed } from "@/constants/action";

import { BOARD_COLUMN, type BoardCard, type BoardColumnId } from "./types";

/**
 * `YYYY-MM-DD`를 로컬 자정 기준 `Date`로 — 마감일 비교는 시각이 아니라 날짜다(§isPastDue와 동일).
 * ⚠️ `getBoardColumn`의 시작일 비교가 여기 쓴다 — 마감 경과 비교는 `isPastDue`로 공용화됐다.
 */
function toLocalMidnight(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function startOfToday(today: Date): Date {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 카드가 지금 몇 칸에 있는지 — **완료만 저장된 값**이고 나머지는 항상 날짜로 계산한다.
 * 오늘이 시작일보다 이르면 할 일, 아니면 진행중(마감이 지났어도 진행중 칸 안에서
 * "지연" 배지로만 표시한다 — 별도 칸이 아니다, `isCardDelayed` 참고).
 */
export function getBoardColumn(
  card: Pick<BoardCard, "isDone" | "startDate">,
  today: Date,
): BoardColumnId {
  if (card.isDone) return BOARD_COLUMN.DONE;
  return startOfToday(today) < toLocalMidnight(card.startDate)
    ? BOARD_COLUMN.TODO
    : BOARD_COLUMN.IN_PROGRESS;
}

/**
 * 지연 배지 — 마감 경과 여부만 본다. **칸(진행중 한정) 판정은 호출부**가 한다.
 *
 * ⚠️ 여기서 `getBoardColumn`을 부르지 않는다 — 화면(`board-view.tsx`)이 드래그 중에 임시로
 *    옮긴 칸(`overrides[card.id]`)까지 함께 봐야 하고, 그건 저장된 값(`isDone`)만 보는
 *    `getBoardColumn`이 모른다. 여기서 칸을 판정하면 카드를 완료로 끌어다 놓아도 서버
 *    저장 전까지 지연 배지가 남는다.
 * ⚠️ **판정 자체는 `isDelayed` 하나뿐이다**(2026-08-18 정정 — 전엔 `isPastDue`를 여기서
 *    한 번 더 조합해 같은 규칙이 두 벌이었다). 보드 카드는 `ActionStatus`가 아니라
 *    `isDone`만 들고 있어 입력 모양만 맞춰 준다 — `isDone`이면 완료로, 아니면 진행중으로
 *    본다(칸 판정은 위에서 이미 걸러졌으므로 할일 칸일 가능성은 여기 안 온다).
 */
export function isCardDelayed(card: Pick<BoardCard, "isDone" | "dueDate">, today: Date): boolean {
  return isDelayed(
    { status: card.isDone ? ACTION_STATUS.DONE : ACTION_STATUS.IN_PROGRESS, dueDate: card.dueDate },
    today,
  );
}

/**
 * 드래그 허용 규칙 — 할 일→진행중·진행중→완료·완료→진행중만 된다.
 * 그 외(할 일↔완료 직행, 진행중→할 일)는 전부 막는다(§상태 정책).
 */
export function canMoveCard(from: BoardColumnId, to: BoardColumnId): boolean {
  if (from === to) return true;
  if (from === BOARD_COLUMN.TODO && to === BOARD_COLUMN.IN_PROGRESS) return true;
  if (from === BOARD_COLUMN.IN_PROGRESS && to === BOARD_COLUMN.DONE) return true;
  if (from === BOARD_COLUMN.DONE && to === BOARD_COLUMN.IN_PROGRESS) return true;
  return false;
}

/** 카드 목록을 칸별로 나눈다. */
export function groupCardsByColumn(
  cards: BoardCard[],
  today: Date,
): Record<BoardColumnId, BoardCard[]> {
  const groups: Record<BoardColumnId, BoardCard[]> = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  for (const card of cards) {
    groups[getBoardColumn(card, today)].push(card);
  }
  return groups;
}
