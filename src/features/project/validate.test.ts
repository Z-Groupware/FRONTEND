import type { ProjectDraft } from "./types";
import { validateProjectDraft } from "./validate";

function draft(overrides: Partial<ProjectDraft>): ProjectDraft {
  return {
    name: "연예인 굿즈 쇼핑몰 앱 구축",
    tag: "GOODS",
    description: "설명",
    tagColor: "slate",
    startDate: "2026-08-01",
    dueDate: "2026-09-01",
    teamNames: ["개발팀"],
    ...overrides,
  };
}

describe("validateProjectDraft — 날짜", () => {
  it("정상 범위(시작일 ≤ 마감일)면 통과한다", () => {
    expect(validateProjectDraft(draft({}))).toEqual({});
  });

  it("형식은 맞지만 실제로 없는 날짜(2월 30일)는 막는다", () => {
    const errors = validateProjectDraft(draft({ startDate: "2026-02-30" }));
    expect(errors.startDate).toBeDefined();
  });

  it("자릿수가 안 맞는 값(2026-2-01)은 막는다", () => {
    const errors = validateProjectDraft(draft({ dueDate: "2026-2-01" }));
    expect(errors.dueDate).toBeDefined();
  });

  it("마감 기한이 시작일보다 앞서면 막는다", () => {
    const errors = validateProjectDraft(draft({ startDate: "2026-09-01", dueDate: "2026-08-01" }));
    expect(errors.dueDate).toBe("마감 기한은 시작일보다 앞설 수 없습니다");
  });

  it("시작일 자체가 잘못됐으면 순서 비교 오류를 덧씌우지 않는다", () => {
    const errors = validateProjectDraft(draft({ startDate: "2026-02-30", dueDate: "2026-08-01" }));
    expect(errors.dueDate).toBeUndefined();
  });
});
