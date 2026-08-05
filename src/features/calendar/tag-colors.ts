import { CALENDAR_ITEM_TAG, type CalendarItemTag } from "./types";

/**
 * 태그별 기본 점/막대 색 — 항목에 `color`가 없을 때만 쓴다.
 * 캘린더 막대(`personal-calendar.tsx`)·범례(`calendar-legend.tsx`)·상세조회 리스트
 * (`calendar-event-list-item.tsx`)가 전부 이 값 하나를 같이 쓴다 — 따로 두면 색이 어긋난다.
 */
export const CALENDAR_TAG_DOT_COLOR: Record<CalendarItemTag, string> = {
  [CALENDAR_ITEM_TAG.PERSONAL_TODO]: "var(--calendar-todo)",
  [CALENDAR_ITEM_TAG.PERSONAL_ACTION]: "var(--calendar-action)",
};
