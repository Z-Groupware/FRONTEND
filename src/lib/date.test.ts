import { formatElapsed, formatMonthDayWeekday } from "./date";

/**
 * ⚠️ `todayIso()`는 테스트하지 않는다 — 실제 시계를 읽는 함수라 시각을 고정하지 않으면
 *    검증이 그날그날 달라진다. 계산은 전부 `formatElapsed`가 하고, 그건 기준 날짜를
 *    인자로 받으므로 여기서 온전히 검증된다.
 */
describe("formatElapsed", () => {
  const TODAY = "2026-08-05";

  it("같은 날은 오늘, 하루 전은 어제다", () => {
    expect(formatElapsed("2026-08-05", TODAY)).toBe("오늘");
    expect(formatElapsed("2026-08-04", TODAY)).toBe("어제");
  });

  it("한 주 안쪽은 일 단위로 센다", () => {
    expect(formatElapsed("2026-08-03", TODAY)).toBe("2일 전");
    expect(formatElapsed("2026-07-30", TODAY)).toBe("6일 전");
  });

  it("한 달 안쪽은 주 단위로 센다 — 4주까지만 쓴다", () => {
    expect(formatElapsed("2026-07-29", TODAY)).toBe("1주 전");
    expect(formatElapsed("2026-07-08", TODAY)).toBe("4주 전");
  });

  it("한 달을 넘기면 달 단위로 센다", () => {
    expect(formatElapsed("2026-07-06", TODAY)).toBe("1개월 전");
    expect(formatElapsed("2026-03-27", TODAY)).toBe("4개월 전");
  });

  it("11개월과 1년이 겹치지 않는다 — 일수/30으로 세면 364일이 12개월이 된다", () => {
    expect(formatElapsed("2025-08-06", TODAY)).toBe("11개월 전");
    expect(formatElapsed("2025-08-05", TODAY)).toBe("1년 전");
  });

  it("해를 넘기면 연 단위로 센다", () => {
    expect(formatElapsed("2025-11-14", TODAY)).toBe("8개월 전");
    expect(formatElapsed("2024-02-06", TODAY)).toBe("2년 전");
  });

  it("미래 날짜는 지어내지 않고 null이다 — 부르는 쪽이 절대 날짜로 물러선다", () => {
    expect(formatElapsed("2026-08-06", TODAY)).toBeNull();
  });

  it("형식이 아니면 null이다", () => {
    expect(formatElapsed("", TODAY)).toBeNull();
    expect(formatElapsed("어제", TODAY)).toBeNull();
  });
});

describe("formatMonthDayWeekday", () => {
  it("월·일·요일을 조립한다 — 2026-09-05는 토요일", () => {
    expect(formatMonthDayWeekday("2026-09-05")).toBe("9월 5일(토)");
    expect(formatMonthDayWeekday("2026-08-05")).toBe("8월 5일(수)");
  });

  it("앞자리 0을 붙이지 않는다", () => {
    expect(formatMonthDayWeekday("2026-01-03")).toBe("1월 3일(토)");
  });

  it("형식이 아니면 null이다", () => {
    expect(formatMonthDayWeekday("2026/09/05")).toBeNull();
    expect(formatMonthDayWeekday("")).toBeNull();
  });
});
