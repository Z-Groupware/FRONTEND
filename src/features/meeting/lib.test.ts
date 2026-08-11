import { formatMeetingSchedule } from "./lib";

describe("formatMeetingSchedule", () => {
  it("우리 날짜 표기와 시각 범위를 한 줄로 잇는다", () => {
    const start = new Date("2026-07-14T10:00:00+09:00");
    const end = new Date("2026-07-14T10:30:00+09:00");

    expect(formatMeetingSchedule(start, end)).toBe("7월 14일(화) 10:00 – 10:30");
  });

  /*
    ⚠️ `toISOString()`으로 조립했다면 여기서 틀린다 — 한국 아침 회의(00:00 UTC 이전)가
       전날 날짜로 적힌다.
  */
  it("한국 아침 회의가 전날로 밀리지 않는다", () => {
    const start = new Date("2026-08-14T08:00:00+09:00"); // UTC로는 13일 23:00
    const end = new Date("2026-08-14T08:30:00+09:00");

    expect(formatMeetingSchedule(start, end)).toBe("8월 14일(금) 08:00 – 08:30");
  });
});
