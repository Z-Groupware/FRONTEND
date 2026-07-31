import { DEFAULT_PLAN, planActionLabel, PLANS } from "./plans";
import { PLAN } from "./types";

describe("요금제 목록", () => {
  it("코드가 겹치지 않는다", () => {
    const codes = PLANS.map((plan) => plan.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("기본 선택은 돈이 안 드는 쪽이다", () => {
    expect(DEFAULT_PLAN).toBe(PLAN.FREE);
    expect(PLANS.some((plan) => plan.code === DEFAULT_PLAN)).toBe(true);
  });

  it("밀어주는 플랜은 하나뿐이다 — 배지가 둘이면 고르는 데 도움이 안 된다", () => {
    expect(PLANS.filter((plan) => plan.isRecommended)).toHaveLength(1);
  });

  it("모든 플랜에 이름·가격·기능이 있다", () => {
    for (const plan of PLANS) {
      expect(plan.name).not.toBe("");
      expect(plan.price).not.toBe("");
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });
});

describe("주 버튼 문구", () => {
  it("무료 플랜은 결제라고 하지 않는다", () => {
    const free = PLANS.find((plan) => plan.code === PLAN.FREE)!;
    expect(planActionLabel(free)).toBe("Free 플랜으로 시작하기");
  });

  it("유료 플랜은 결제라고 알린다", () => {
    const team = PLANS.find((plan) => plan.code === PLAN.TEAM)!;
    expect(planActionLabel(team)).toBe("Team 플랜 결제하기");
  });
});
