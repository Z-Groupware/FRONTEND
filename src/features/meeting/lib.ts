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

/** BE `UpdateMeetingRequest.title`의 `@Size(max = 200)`과 같은 값이다 — 어긋나면 화면이 통과시킨 값을 서버가 막는다. */
export const MEETING_TITLE_MAX_LENGTH = 200;

export type MeetingTitleCheck = { ok: true; title: string } | { ok: false; error: string };

/**
 * 회의 제목(MEET-05)이 BE 계약 안에 드는지 — **보내기 전에 여기서 본다.**
 *
 * ⚠️ 서버 검증을 대신하지 않는다. BE도 공백·200자 초과를 400으로 막는다
 *    (`MeetingUpdateService.normalizeTitle`) — 여기서 먼저 보는 건 **필드 옆에 이유를 적기**
 *    위해서다. 왕복해 받은 400은 폼 전체 오류로밖에 못 보여준다(§토스트: 폼 검증 오류는 인라인).
 * ⚠️ **BE와 같은 자리를 잰다** — 앞뒤 공백을 없앤 뒤(`trim`) 길이를 센다. 다르게 재면
 *    화면은 통과시키는데 서버가 막는 값이 생긴다.
 * ⚠️ 던지지 않고 값으로 돌려준다 — 부르는 쪽(Server Action)이 폼 상태로 그대로 옮긴다.
 */
export function checkMeetingTitle(raw: string): MeetingTitleCheck {
  const title = raw.trim();
  if (title.length === 0) return { ok: false, error: "회의 제목을 입력해 주세요." };
  if (title.length > MEETING_TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `회의 제목은 ${MEETING_TITLE_MAX_LENGTH}자까지 입력할 수 있습니다.`,
    };
  }
  return { ok: true, title };
}
