import { BOARD_COLUMN, type BoardCard, type BoardColumnId } from "./types";

/** `YYYY-MM-DD`를 로컬 자정 기준 `Date`로 — 마감일 비교는 시각이 아니라 날짜다(§isDelayed와 동일). */
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

/** 지연 배지 — 완료가 아니고 마감이 지났으면. 시작일은 안 본다(`isDelayed`와 같은 결). */
export function isCardDelayed(card: Pick<BoardCard, "isDone" | "dueDate">, today: Date): boolean {
  if (card.isDone) return false;
  return toLocalMidnight(card.dueDate) < startOfToday(today);
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
