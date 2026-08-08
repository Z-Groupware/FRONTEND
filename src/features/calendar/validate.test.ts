import { validatePersonalTodoDraft } from "./validate";

describe("개인 Todo 작성 검증", () => {
  it("제목·날짜가 다 있으면 통과한다", () => {
    expect(validatePersonalTodoDraft({ title: "보고서 작성", date: "2026-08-05" })).toEqual({});
  });

  it("제목이 비어 있으면 막는다", () => {
    const errors = validatePersonalTodoDraft({ title: "   ", date: "2026-08-05" });
    expect(errors.title).toBe("제목을 입력해 주세요");
  });

  /*
    ⚠️ 개인 Todo는 상세 화면이 없어 **제목 줄이 전부**다. 오른쪽 일정 목록이 자르지 않고
       한 줄에 다 보여줄 수 있는 길이가 20자라, 그 경계를 값으로 고정해 둔다.
  */
  it("제목이 20자를 넘으면 막는다", () => {
    const errors = validatePersonalTodoDraft({ title: "가".repeat(21), date: "2026-08-05" });
    expect(errors.title).toBe("제목은 20자까지 입력할 수 있습니다");
  });

  it("제목이 정확히 20자면 통과한다", () => {
    expect(validatePersonalTodoDraft({ title: "가".repeat(20), date: "2026-08-05" })).toEqual({});
  });

  it("날짜가 비어 있으면 막는다", () => {
    const errors = validatePersonalTodoDraft({ title: "제목", date: "" });
    expect(errors.date).toBe("날짜를 선택해 주세요");
  });

  it("형식이 YYYY-MM-DD가 아니면 막는다", () => {
    const errors = validatePersonalTodoDraft({ title: "제목", date: "2026/08/05" });
    expect(errors.date).toBe("올바른 날짜가 아닙니다");
  });

  // ⚠️ 2월은 30일까지 없다 — 문자열 형식만 보면 통과시켜버리는 실수를 막는 회귀 테스트.
  it("존재하지 않는 날짜(2월 30일)는 막는다", () => {
    const errors = validatePersonalTodoDraft({ title: "제목", date: "2026-02-30" });
    expect(errors.date).toBe("올바른 날짜가 아닙니다");
  });

  it("13월처럼 범위를 벗어난 달도 막는다", () => {
    const errors = validatePersonalTodoDraft({ title: "제목", date: "2026-13-01" });
    expect(errors.date).toBe("올바른 날짜가 아닙니다");
  });

  it("윤년의 2월 29일은 통과한다", () => {
    expect(validatePersonalTodoDraft({ title: "제목", date: "2024-02-29" })).toEqual({});
  });

  it("윤년이 아닌 해의 2월 29일은 막는다", () => {
    const errors = validatePersonalTodoDraft({ title: "제목", date: "2026-02-29" });
    expect(errors.date).toBe("올바른 날짜가 아닙니다");
  });
});
