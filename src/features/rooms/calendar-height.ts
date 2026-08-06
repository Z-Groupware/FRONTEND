const START_HOUR = 8;
const END_HOUR = 18;
const HOURS_VISIBLE = END_HOUR - START_HOUR;
/**
 * 요일 헤더 높이 — `weekly-room-calendar.css`의 `.rbc-time-header-content` 기준.
 * ⚠️ `.rbc-allday-cell`을 숨겨서 헤더는 이제 요일 행 하나뿐이다(예전엔 그 행까지 감안해 더 컸다).
 */
const HEADER_HEIGHT_PX = 32;
/**
 * 30분 칸 높이 — 너무 크면 화면이 늘어지고, 너무 작으면 제목·시간·참석자가 잘린다.
 * ⚠️ 40px는 너무 빡빡해서(팀 피드백) 1.3배(약 52px)로 키웠다 — 컴팩트함은 유지하되 읽히게.
 */
export const HALF_HOUR_SLOT_HEIGHT_PX = 52;

/**
 * 주간 캘린더 전체 높이(px, 고정값) — 뷰포트 비율(`calc(100vh - …)`)로 두면 RBC가 남는 높이를
 * 반칸에 나눠 담아 칸이 다시 얇아진다. 30분 한 칸 높이를 **먼저 정하고** 그 배수로 전체 높이를
 * 거꾸로 계산해야, 회의 내용(제목·시간·참석자)이 항상 들어갈 자리가 보장된다.
 * ⚠️ 그래서 화면 자체가 길어질 수 있다 — `<main>`이 이미 `overflow-y-auto`라 페이지 스크롤로 받는다.
 */
export const WEEKLY_CALENDAR_HEIGHT_PX =
  HEADER_HEIGHT_PX + HOURS_VISIBLE * 2 * HALF_HOUR_SLOT_HEIGHT_PX;
