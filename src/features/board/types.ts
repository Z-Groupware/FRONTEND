/**
 * 보드(칸반) 3열 — 저장되는 값은 사실상 "완료 여부"뿐이다. 할 일/진행중/지연은
 * 시작일·마감일·오늘로 항상 다시 계산한다(§상태 정책, DECISIONS.md).
 */
export const BOARD_COLUMN = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type BoardColumnId = (typeof BOARD_COLUMN)[keyof typeof BOARD_COLUMN];

export const BOARD_COLUMN_LABEL: Record<BoardColumnId, string> = {
  TODO: "할 일",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

/**
 * 카드가 지금 있는 칸(**출발 칸**)에서 **다음 단계로** 넘길 때 버튼에 적는 짧은 워딩 —
 * 목표 칸이 아니라 일 자체에 무슨 일이 나는가를 말한다.
 *
 * ⚠️ **"옮기기"보다 낫다**(2026-08-19, "옮기기 말고 좀 이쁜 워딩 없나"라는 지적).
 * ⚠️ **다음-단계 전용이다.** 되돌리기(드래그·클릭으로 원본 자리에서 벗어난 카드를 다시
 *    제자리로)는 아래 `BOARD_REVERT_LABEL`이 대신 말한다 — 같은 버튼 자리라도 뜻이 완전히
 *    다르다(넘긴다 ≠ 취소한다).
 * ⚠️ 값은 4자로 맞춘다 — 카드 오른쪽 세로줄에 날짜(`8월 12일(토)까지`)와 짝지어 서는데,
 *    너비가 카드마다 달라 보이지 않게 한다.
 */
export const BOARD_NEXT_STEP_LABEL: Record<BoardColumnId, string> = {
  TODO: "시작하기",
  IN_PROGRESS: "완료하기",
  DONE: "이어가기",
};

/**
 * 드래그·클릭으로 원래 자리를 벗어난 카드를 **원래 자리로 되돌리는** 버튼 워딩.
 * 저장 전 미리보기를 취소하는 것이라 "되돌리기"가 맞다(§보드는 저장 전 미리보기).
 */
export const BOARD_REVERT_LABEL = "되돌리기";

export const BOARD_COLUMNS: BoardColumnId[] = [
  BOARD_COLUMN.TODO,
  BOARD_COLUMN.IN_PROGRESS,
  BOARD_COLUMN.DONE,
];

/**
 * 보드 카드 한 장 — 프로젝트든 개인 액션이든 같은 모양으로 다룬다(둘 다 시작일·마감일·완료
 * 여부만 있으면 상태를 계산할 수 있어서). 칩(태그)만 호출부마다 뜻이 다르다.
 */
export interface BoardCard {
  id: number;
  title: string;
  tagLabel: string;
  tagBgColor: string;
  tagTextColor: string;
  /** 작업 시작일 `YYYY-MM-DD` */
  startDate: string;
  /** 마감일 `YYYY-MM-DD` */
  dueDate: string;
  /** 사용자가 보드에서 직접 완료 처리했는지 — 유일하게 저장되는 값 */
  isDone: boolean;
}

/** 오너는 프로젝트, 팀장·사원은 본인 개인 액션 — 보드 종류는 둘뿐이다. */
export type BoardType = "project" | "my-action";

/** 드래그로 만든 변경 — 저장 전에는 화면(로컬 상태)에만 있다. */
export interface BoardChange {
  id: number;
  toColumn: BoardColumnId;
}

/** 옮긴 뒤 저장 안내 — 화면에 직접 적지 않는다(§도메인 상수: 라벨 하드코딩 금지). */
export const BOARD_SAVE_HINT = "옮긴 뒤 [저장하기]를 눌러야 반영됩니다.";

/** 빈 칸 안내 — 받아 줄 수 있는 칸과 못 받는 칸이 다른 말을 한다. */
export const BOARD_EMPTY_HINT = "여기로 옮겨 주세요.";
export const BOARD_BLOCKED_HINT = "여기로는 옮길 수 없습니다.";
