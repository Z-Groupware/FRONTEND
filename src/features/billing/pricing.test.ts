import { PLANS } from "./plans";
import {
  BILLING_CYCLE,
  calculatePrice,
  formatWon,
  parsePrice,
  SEAT_RANGE,
  VAT_RATE,
} from "./pricing";
import { PLAN } from "./types";

const team = PLANS.find((plan) => plan.code === PLAN.TEAM)!;

describe("가격 문자열 파싱", () => {
  it("통화 기호와 자릿점을 걷어낸다", () => {
    expect(parsePrice("₩9,900")).toBe(9900);
  });

  it("숫자가 없으면 0이다 — 무료 플랜이 NaN이 되면 합계가 통째로 깨진다", () => {
    expect(parsePrice("무료")).toBe(0);
  });
});

describe("월간 결제", () => {
  it("시안 값과 맞는다 — 12명 × 9,900 = 118,800 · VAT 11,880 · 합계 130,680", () => {
    const price = calculatePrice(team, 12, BILLING_CYCLE.MONTHLY);
    expect(price).toEqual({
      unitPrice: 9900,
      seats: 12,
      subtotal: 118800,
      vat: 11880,
      total: 130680,
      // 월간은 아낀 금액이 없다
      yearlySaving: 0,
    });
  });

  it("합계는 언제나 소계 + 부가세다", () => {
    const price = calculatePrice(team, 37, BILLING_CYCLE.MONTHLY);
    expect(price.total).toBe(price.subtotal + price.vat);
  });
});

describe("연간 결제", () => {
  it("12개월치에서 20% 깎는다", () => {
    const price = calculatePrice(team, 1, BILLING_CYCLE.YEARLY);
    expect(price.unitPrice).toBe(Math.round(9900 * 12 * 0.8));
  });

  it("같은 인원이면 월간 12개월보다 싸다", () => {
    const yearly = calculatePrice(team, 10, BILLING_CYCLE.YEARLY);
    const monthly = calculatePrice(team, 10, BILLING_CYCLE.MONTHLY);
    expect(yearly.total).toBeLessThan(monthly.total * 12);
  });
});

describe("구성원 수 범위", () => {
  it("최소 미만은 최소로 올린다 — 0명 결제가 나가면 안 된다", () => {
    expect(calculatePrice(team, 0, BILLING_CYCLE.MONTHLY).seats).toBe(SEAT_RANGE.min);
  });

  it("상한을 넘으면 상한으로 낮춘다", () => {
    expect(calculatePrice(team, 9999, BILLING_CYCLE.MONTHLY).seats).toBe(SEAT_RANGE.max);
  });
});

describe("부가세", () => {
  // ⚠️ 소수점을 남기면 화면 합계와 실제 청구가 1원씩 어긋난다.
  it("원 단위로 반올림한다", () => {
    const price = calculatePrice(team, 7, BILLING_CYCLE.MONTHLY);
    expect(Number.isInteger(price.vat)).toBe(true);
    expect(price.vat).toBe(Math.round(price.subtotal * VAT_RATE));
  });
});

describe("금액 표기", () => {
  it("통화 기호와 자릿점을 붙인다", () => {
    expect(formatWon(118800)).toBe("₩118,800");
  });

  it("0원도 그대로 보여준다", () => {
    expect(formatWon(0)).toBe("₩0");
  });
});

describe("연간 할인 금액", () => {
  it("1년치 정가에서 20%를 아낀 금액을 담는다 — 12명이면 285,120원", () => {
    const price = calculatePrice(team, 12, BILLING_CYCLE.YEARLY);

    // 정가 9,900 × 12개월 × 12명 = 1,425,600 · 할인가 = 그 80%
    expect(price.yearlySaving).toBe(1_425_600 - price.subtotal);
    expect(price.yearlySaving).toBe(285_120);
  });

  it("월간이면 0이다", () => {
    expect(calculatePrice(team, 12, BILLING_CYCLE.MONTHLY).yearlySaving).toBe(0);
  });
});
