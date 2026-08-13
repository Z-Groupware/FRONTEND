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

/**
 * 회의 목록(MEET-02)이 물어볼 기간 — 앞뒤로 3개월씩.
 *
 * ⚠️ **뒤를 열어 주는 게 핵심이다.** BE 기본값은 `오늘-3개월 ~ 오늘`이라
 *    (`MeetingListQueryService.validateAndResolve`) 그대로 두면 **예정 회의가 한 건도 안 온다** —
 *    이 화면이 제일 먼저 보여줘야 하는 게 다가올 회의다.
 * ⚠️ 앞은 BE 기본과 같은 3개월로 맞춘다. 더 늘리면 무한 스크롤이 없는 지금은 한 페이지
 *    상한(100건)만 더 빨리 채운다(§server `MEETING_LIST_PAGE_SIZE`).
 * ⚠️ 날짜는 **한국 시간 기준**으로 찍는다 — UTC로 자르면 자정 무렵에 하루가 밀린다(§lib/date).
 */
const MEETING_LIST_RANGE_MONTHS = 3;

export function meetingListRange(now: Date): { from: string; to: string } {
  const shifted = (months: number) => {
    const moved = new Date(now);
    moved.setMonth(moved.getMonth() + months);
    return DATE_PART.format(moved);
  };

  return { from: shifted(-MEETING_LIST_RANGE_MONTHS), to: shifted(MEETING_LIST_RANGE_MONTHS) };
}
