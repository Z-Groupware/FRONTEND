import { formatMeetingDate, getDaysUntilDue } from "./lib";

describe("getDaysUntilDue", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-05T00:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("오늘이 마감이면 0을 반환한다", () => {
    expect(getDaysUntilDue("2026-08-05")).toBe(0);
  });

  it("미래 날짜는 남은 일수를 반환한다", () => {
    expect(getDaysUntilDue("2026-08-12")).toBe(7);
  });

  it("지난 날짜는 음수를 반환한다", () => {
    expect(getDaysUntilDue("2026-08-01")).toBe(-4);
  });
});

describe("formatMeetingDate", () => {
  it("월 일(요일) 시:분 형식으로 포맷한다", () => {
    expect(formatMeetingDate("2026-08-20T10:00:00")).toBe("8월 20일(목) 10:00");
  });

  it("한 자리 시·분도 두 자리로 채운다", () => {
    expect(formatMeetingDate("2026-09-01T09:05:00")).toBe("9월 1일(화) 09:05");
  });
});
