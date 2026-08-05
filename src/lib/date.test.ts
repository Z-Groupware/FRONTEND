import { formatDate, formatDateWithYear, formatElapsed } from "./date";

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

const THIS_YEAR = 2026;

describe("formatDateWithYear", () => {
  // 기준 연도는 서버가 정해 내려준다 — 함수가 `new Date()`를 부르지 않는다(하이드레이션)
  it("ISO를 우리 날짜 표기로 바꾼다 — 2026-05-03 → 5월 3일(일)", () => {
    expect(formatDateWithYear("2026-05-03", THIS_YEAR)).toBe("5월 3일(일)");
  });

  it("요일이 시간대에 밀리지 않는다 — 자정 UTC 파싱 함정", () => {
    // 2026-01-12는 월요일이다. new Date(iso)로 읽으면 지역 시간대에서 하루 밀릴 수 있다
    expect(formatDateWithYear("2026-01-12", THIS_YEAR)).toBe("1월 12일(월)");
  });

  it("올해가 아니면 연도를 붙인다 — 얼마나 오래됐는지 알 수 있어야 한다", () => {
    expect(formatDateWithYear("2025-12-03", THIS_YEAR)).toBe("2025년 12월 3일(수)");
    expect(formatDateWithYear("2024-02-06", THIS_YEAR)).toBe("2024년 2월 6일(화)");
  });

  it("올해 날짜에는 연도를 안 붙인다 — 매 줄에 붙으면 옛 날짜가 안 튄다", () => {
    expect(formatDateWithYear("2026-02-06", THIS_YEAR)).not.toContain("년");
  });

  it("형식이 아니면 원문을 그대로 둔다 — 지어내지 않는다", () => {
    expect(formatDateWithYear("", THIS_YEAR)).toBe("");
    expect(formatDateWithYear("어제", THIS_YEAR)).toBe("어제");
  });
});

/**
 * ⚠️ **ISO를 화면에 그대로 찍지 않는다.** 구독 해지 창이 `2026-09-01`을 그대로 보여 줘서
 *    읽는 사람이 날짜를 한 번 더 해석해야 했다 — 그 회귀를 막는다.
 */
describe("formatDate", () => {
  it("우리 표기로 바꾼다 — 2026-09-01 → 9월 1일(화)", () => {
    expect(formatDate("2026-09-01")).toBe("9월 1일(화)");
  });

  /* ⚠️ `new Date(iso)`로 파싱하면 UTC 자정이라 시간대에 따라 하루가 밀린다 */
  it("요일이 시간대에 안 밀린다", () => {
    expect(formatDate("2026-05-03")).toBe("5월 3일(일)");
    expect(formatDate("2026-01-12")).toBe("1월 12일(월)");
  });

  it("연도를 붙이지 않는다 — 붙이려면 `formatDateWithYear`를 쓴다", () => {
    expect(formatDate("2024-02-06")).not.toContain("년");
  });

  it("형식이 아니면 원문을 그대로 둔다 — 지어내지 않는다", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("내일")).toBe("내일");
  });
});
