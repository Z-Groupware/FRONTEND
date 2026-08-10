const START_HOUR = 8;
const END_HOUR = 18;
const HOURS_VISIBLE = END_HOUR - START_HOUR;
/**
 * 요일 헤더 높이 — `weekly-room-calendar.css`의 `.rbc-time-header-content` 기준.
 * ⚠️ `.rbc-allday-cell`을 숨겨서 헤더는 이제 요일 행 하나뿐이다(예전엔 그 행까지 감안해 더 컸다).
 */
const HEADER_HEIGHT_PX = 32;
/**
 * 30분 칸 높이 — 이벤트 카드가 제목 1줄 + (시간·참석자) 1줄, 총 2줄로 줄어서(2026-08-10)
 * 52px보다 낮아도 내용이 잘리지 않는다. `lg` 미만(페이지 스크롤 화면)의 기준 높이로만 쓴다.
 */
export const HALF_HOUR_SLOT_HEIGHT_PX = 40;

/**
 * 주간 캘린더 기준 높이(px) — `lg` 미만에서만 이 고정값을 쓴다(스크롤 화면, `<main>`이
 * `overflow-y-auto`). **`lg` 이상에서는 쓰지 않는다** — 캘린더가 한 화면에 다 들어와야 해서
 * (팀 확정, 2026-08-10) 그 구간에서는 부모 flex 컨테이너가 주는 실제 높이(`h-full`)를 그대로
 * 채운다. RBC가 남는 높이를 반칸에 나눠 칸이 얇아지는 건 이번엔 의도된 동작이다 — 화면이
 * 크면 칸도 커지고, 작으면(하지만 `lg` 안에서는) 그만큼 줄어든다.
 */
export const WEEKLY_CALENDAR_HEIGHT_PX =
  HEADER_HEIGHT_PX + HOURS_VISIBLE * 2 * HALF_HOUR_SLOT_HEIGHT_PX;
