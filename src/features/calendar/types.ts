/**
 * 개인 캘린더 — 격리막의 UI 계약(CLAUDE.md §Mock 격리막).
 * 컴포넌트는 이 타입만 알고, 목/실서버 분기는 `server.ts`가 끝낸다.
 */

/**
 * 캘린더에 얹히는 항목 종류.
 * ⚠️ 이 화면에서 만들 수 있는 건 PERSONAL_TODO뿐이다 — PERSONAL_ACTION은 액션 도메인(AC)에서
 *    읽어와 표시만 한다. 액션은 AI가 회의 요약으로만 생성한다(CLAUDE.md §도메인 상수).
 */
export const CALENDAR_ITEM_TAG = {
  PERSONAL_TODO: "PERSONAL_TODO",
  PERSONAL_ACTION: "PERSONAL_ACTION",
} as const;
export type CalendarItemTag = (typeof CALENDAR_ITEM_TAG)[keyof typeof CALENDAR_ITEM_TAG];

export const CALENDAR_ITEM_TAG_LABEL: Record<CalendarItemTag, string> = {
  PERSONAL_TODO: "개인 Todo",
  PERSONAL_ACTION: "개인 액션",
};

/** 완료 여부 배지 문구 — Todo·액션 공통(`calendar-event-list-item.tsx`). */
export const CALENDAR_COMPLETION_LABEL = {
  DONE: "완료",
  IN_PROGRESS: "진행중",
} as const;

export function getCalendarCompletionLabel(isCompleted: boolean): string {
  return isCompleted ? CALENDAR_COMPLETION_LABEL.DONE : CALENDAR_COMPLETION_LABEL.IN_PROGRESS;
}

/** 캘린더 한 칸에 그려지는 항목. react-big-calendar의 start/end 접근자가 그대로 이 필드명을 쓴다. */
export interface PersonalCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  tag: CalendarItemTag;
  isCompleted: boolean;
  /** 지정 안 하면 tag 기본색을 쓴다 — 항목별로 자유롭게 덮어쓸 수 있는 색상. */
  color?: string;
}

/** 개인 Todo 작성 폼 입력 — 화면과 서버가 같은 스키마(`validate.ts`)로 검증한다. */
export interface PersonalTodoDraft {
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  color?: string;
}

export type PersonalTodoFormErrors = Partial<Record<keyof PersonalTodoDraft, string>>;
