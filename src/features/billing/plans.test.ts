import { CURRENT_PLAN, PLAN_UNLIMITED, PLANS } from "./plans";
import { PLAN } from "./types";

describe("요금제 목록", () => {
  it("코드가 겹치지 않는다", () => {
    const codes = PLANS.map((plan) => plan.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("배지를 달지 않는다 — 하나뿐이라 비교 대상이 없다", () => {
    expect(PLANS.every((plan) => !plan.isRecommended)).toBe(true);
  });

  it("모든 플랜에 이름·기능이 있다", () => {
    for (const plan of PLANS) {
      expect(plan.name).not.toBe("");
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it("지금 파는 플랜이 목록 안에 있다 — 화면이 늘 그릴 게 있어야 한다", () => {
    expect(PLANS).toContain(CURRENT_PLAN);
  });
});

/*
  ⚠️ 무료 요금제를 없앤 뒤(2026-08-04) **무료 표기가 남아 있지 않은지**를 여기서 잡는다.
     한 곳만 안 고쳐도 "무료로 써 보세요"가 남아 돈을 안 받는 것처럼 읽힌다.
  ⚠️ 한도가 화면마다 다른 말을 하던 문제(어떤 곳은 "무제한", 어떤 곳은 "200명")도 같이 막는다.
     문구를 손으로 적으면 여기서 걸린다.
*/
describe("유료 하나뿐 — 무료가 남아 있지 않다", () => {
  it("파는 플랜은 하나다", () => {
    expect(PLANS).toHaveLength(1);
    expect(Object.values(PLAN)).toEqual([PLAN.TEAM]);
  });

  it("플랜 문구에 '무료'가 없다", () => {
    const text = PLANS.flatMap((plan) => [plan.name, ...plan.features]).join(" ");
    expect(text).not.toMatch(/무료/);
  });

  it("인원에 제한을 적지 않는다 — 좌석 과금이 아니다", () => {
    expect(PLAN_UNLIMITED).toContain("인원 제한 없음");
  });

  it("보관을 '무제한'이라고 적지 않는다 — 자막도 저장 공간에 포함된다", () => {
    expect(PLAN_UNLIMITED).toContain("보관 기한 없음");
    expect(PLAN_UNLIMITED.join(" ")).not.toMatch(/무제한/);
  });

  it("플랜 목록에 금액 필드 자체가 없다 — 금액은 BE 설정에서 온다", () => {
    for (const plan of PLANS) {
      expect(plan).not.toHaveProperty("price");
      expect(plan).not.toHaveProperty("unit");
    }
  });

  it("무제한 항목은 셋이고 서로 다르다", () => {
    expect(new Set(PLAN_UNLIMITED).size).toBe(PLAN_UNLIMITED.length);
  });
});
