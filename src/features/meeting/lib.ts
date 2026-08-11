import { formatMonthDayWeekday } from "@/lib/date";

/** 화면 표기의 시간대 — 서버가 UTC여도 사용자는 한국 시각으로 본다 */
const TIME_ZONE = "Asia/Seoul";

const DATE_PART = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const TIME_PART = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * 회의 시간 한 줄 — `7월 14일(화) 10:00 – 10:30`.
 *
 * ⚠️ `toISOString()`으로 만들면 안 된다 — 그건 **UTC**라 한국 아침 회의가 전날 밤으로
 *    적힌다(§lib/date의 같은 경고). 시간대를 박은 `Intl`로만 꺼낸다.
 * ⚠️ 날짜 표기는 `formatMonthDayWeekday`를 거친다 — 화면마다 날짜를 손으로 조립하면
 *    `8월 5일(수)` 표기(§디자인 토큰)가 한 곳씩 어긋난다.
 */
export function formatMeetingSchedule(start: Date, end: Date): string {
  const day = formatMonthDayWeekday(DATE_PART.format(start)) ?? DATE_PART.format(start);
  return `${day} ${TIME_PART.format(start)} – ${TIME_PART.format(end)}`;
}
