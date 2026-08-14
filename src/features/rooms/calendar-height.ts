import { GRID_END_HOUR, GRID_START_HOUR } from "./grid-slot";

/** ⚠️ 시간대는 `grid-slot.ts`가 정본이다 — 여기서 시작·끝 시각을 또 적으면 칸 높이와 칸 시각이 갈린다. */
const HOURS_VISIBLE = GRID_END_HOUR - GRID_START_HOUR;
/**
 * 요일 헤더 높이 — `weekly-room-calendar.css`의 `.rbc-time-header-content` 기준.
 * ⚠️ `.rbc-allday-cell`을 숨겨서 헤더는 이제 요일 행 하나뿐이다(예전엔 그 행까지 감안해 더 컸다).
 */
const HEADER_HEIGHT_PX = 32;
/**
 * 30분 칸 높이 — 기존(40px)의 1.5배(2026-08-14, 팀 확정). 이벤트 카드가 제목 1줄 +
 * (시간·참석자) 1줄, 총 2줄이라 이 높이면 내용이 잘리지 않는다.
 * ⚠️ **`lg` 이상에서도 고정값이다**(`weekly-room-calendar.css`의 `.rbc-time-slot` 오버라이드).
 *    하루 24시간(48칸)을 화면 높이에 맞춰 매번 다시 나누면 화면이 작을 때 글자가 넘친다 —
 *    칸 높이는 고정하고, 화면에 다 안 들어오는 시간대는 캘린더 안에서만 스크롤한다.
 */
export const HALF_HOUR_SLOT_HEIGHT_PX = 60;

/**
 * 주간 캘린더 기준 높이(px) — `lg` 미만에서만 이 고정값을 쓴다(스크롤 화면, `<main>`이
 * `overflow-y-auto`, 하루 24시간을 그대로 펼쳐 페이지가 길어진다). **`lg` 이상에서는 쓰지
 * 않는다** — 부모 flex 컨테이너가 주는 실제 높이(`h-full`)만큼만 차지하고, 넘치는 시간대는
 * 캘린더 내부 스크롤로 본다(2026-08-14 변경 — 이전엔 칸 높이를 눌러 한 화면에 다 담았다).
 */
export const WEEKLY_CALENDAR_HEIGHT_PX =
  HEADER_HEIGHT_PX + HOURS_VISIBLE * 2 * HALF_HOUR_SLOT_HEIGHT_PX;
