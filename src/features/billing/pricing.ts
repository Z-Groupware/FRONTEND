import type { Plan } from "./types";

/** 결제 주기. 화면엔 라벨을 쓰고 코드는 영문 상수로만 다룬다. */
export const BILLING_CYCLE = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;

export type BillingCycle = (typeof BILLING_CYCLE)[keyof typeof BILLING_CYCLE];

export const BILLING_CYCLE_LABEL: Record<BillingCycle, string> = {
  [BILLING_CYCLE.MONTHLY]: "월간",
  [BILLING_CYCLE.YEARLY]: "연간",
};

/**
 * ⚠️ 아래 값은 **팀 확정 전 임시값**이다(DECISIONS §미결정: 결제 실연동 여부).
 *    가격 정책이 정해지면 BE에서 내려받는다.
 */
export const SEAT_RANGE = { min: 1, max: 200 } as const;
/** 연간 결제 할인율 — 20% */
export const YEARLY_DISCOUNT_RATE = 0.2;
/** 부가세율 — 10% */
export const VAT_RATE = 0.1;

export interface PriceBreakdown {
  /** 1인당 단가(주기 기준) */
  unitPrice: number;
  /** 구성원 수 */
  seats: number;
  /** 소계 = 단가 × 인원 */
  subtotal: number;
  vat: number;
  total: number;
  /**
   * 연간을 골라서 아낀 금액. 월간이면 0이다.
   * 할인율(20%)만 보여주면 얼마를 아끼는지 감이 안 온다 — 금액으로 같이 보여준다.
   */
  yearlySaving: number;
}

/**
 * 표시용 가격 문자열(`₩9,900`)에서 숫자만 뽑는다.
 * ⚠️ 임시다 — BE가 숫자 필드를 내려주면 이 함수는 사라진다. 지금은 목이 문자열뿐이다.
 */
export function parsePrice(price: string): number {
  const digits = price.replace(/[^0-9]/g, "");
  return digits === "" ? 0 : Number(digits);
}

/**
 * 결제 금액 계산.
 *
 * ⚠️ **원 단위에서 반올림한다.** 할인·부가세를 소수로 두면 화면과 실제 청구가 1원씩 어긋난다.
 *    소계를 먼저 확정한 뒤 그 값으로 부가세를 매긴다 — 순서가 바뀌면 합계가 달라진다.
 */
export function calculatePrice(plan: Plan, seats: number, cycle: BillingCycle): PriceBreakdown {
  const monthly = parsePrice(plan.price);
  const safeSeats = Math.min(Math.max(seats, SEAT_RANGE.min), SEAT_RANGE.max);

  const unitPrice =
    cycle === BILLING_CYCLE.YEARLY
      ? Math.round(monthly * 12 * (1 - YEARLY_DISCOUNT_RATE))
      : monthly;

  const subtotal = unitPrice * safeSeats;
  const vat = Math.round(subtotal * VAT_RATE);

  // 연간 할인은 "1년치 정가 − 할인가"다. 부가세 전 금액으로 잡는다(할인 뒤에 세금이 붙는다)
  const yearlySaving = cycle === BILLING_CYCLE.YEARLY ? monthly * 12 * safeSeats - subtotal : 0;

  return { unitPrice, seats: safeSeats, subtotal, vat, total: subtotal + vat, yearlySaving };
}

/** 금액 표기 — `₩118,800`. 자릿점은 로케일에 맡기지 않는다(서버·클라이언트가 갈릴 수 있다). */
export function formatWon(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}
