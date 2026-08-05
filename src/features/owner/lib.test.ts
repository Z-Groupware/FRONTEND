import { getDaysUntilDue } from "./lib";

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
