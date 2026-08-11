/**
 * 보드(칸반) 3열 — 저장되는 값은 사실상 "완료 여부"뿐이다. 할일/진행중/지연은
 * 시작일·마감일·오늘로 항상 다시 계산한다(§상태 정책, DECISIONS.md).
 */
export const BOARD_COLUMN = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type BoardColumnId = (typeof BOARD_COLUMN)[keyof typeof BOARD_COLUMN];

export const BOARD_COLUMN_LABEL: Record<BoardColumnId, string> = {
  TODO: "할일",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

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
