import type { PlanCode } from "./types";

/**
 * 구독 현황 화면(`/manage/billing`)의 **UI 계약**.
 *
 * ⚠️ 컴포넌트는 이 타입만 본다. BE 응답 모양이 정해지면 매퍼가 여기에 맞춰 흡수한다 —
 *    연동할 때 `server.ts`와 매퍼만 고치고 컴포넌트는 0줄 바꾼다(CLAUDE.md §격리막).
 * ⚠️ 금액은 **숫자로** 들고 다닌다. 서식은 화면에서 `formatWon`이 붙인다 —
 *    문자열로 받으면 합계를 다시 계산할 수 없다.
 * ⚠️ 날짜는 ISO 문자열(`2026-08-01`)이다. 화면 표기는 §카피(`8월 1일(토)`)를 따르되,
 *    결제일처럼 **정확한 값이 중요한 자리**는 표를 읽기 쉽게 ISO를 그대로 쓴다.
 */

/**
 * 구독 상태.
 *
 * ⚠️ **무료 플랜은 없다**(2026-08-04 확정). 전에는 `FREE`가 "무료 요금제"와 "아직 결제 안 함"을
 *    같이 뜻해서, 화면이 어느 쪽인지 알 수 없었다 — 지금은 **왜 못 쓰는지**까지 상태가 말한다.
 * ⚠️ 쓸 수 있는지는 상태를 하나하나 비교하지 말고 `canUseWorkspace`로 판정한다.
 *    비교를 화면마다 적으면 상태가 늘 때 한 곳을 빠뜨린다.
 */
export const SUBSCRIPTION_STATUS = {
  /** 결제 중 — 정상 이용 */
  ACTIVE: "ACTIVE",
  /** 해지 신청은 했고 **이번 주기까지는 그대로 쓴다** */
  CANCELING: "CANCELING",
  /** 온보딩은 끝났는데 아직 결제 전 — 결제 화면에서 막혀 있다 */
  UNPAID: "UNPAID",
  /** 기간이 끝났다 — 다시 결제하기 전엔 들어올 수 없다 */
  EXPIRED: "EXPIRED",
} as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: "이용 중",
  CANCELING: "해지 예정",
  UNPAID: "결제 전",
  EXPIRED: "만료",
};

/**
 * 워크스페이스를 쓸 수 있는 상태인지.
 *
 * ⚠️ **해지 예정도 쓸 수 있다.** 이미 낸 기간이라 그 안에서는 아무것도 막지 않는다 —
 *    해지를 눌렀다고 바로 잠그면 낸 돈만큼을 못 쓰게 된다.
 * ⚠️ 화면에서 이걸로 감추더라도 **판정은 서버가 다시 한다**(CLAUDE.md §권한).
 */
export function canUseWorkspace(status: SubscriptionStatus): boolean {
  return status === SUBSCRIPTION_STATUS.ACTIVE || status === SUBSCRIPTION_STATUS.CANCELING;
}

/**
 * 이번 주기에 쓴 양 — **청구 지표**다.
 *
 * ⚠️ 총량(포함량)은 여기 담지 않는다. 그건 `BillingConfig`가 쥐고 있어서, 두 벌로 들고 있으면
 *    반드시 어긋난다 — 화면은 `buildUsage()`로 그때그때 계산한다.
 */
export interface UsageCounters {
  /** 이번 주기에 쓴 AI 토큰 */
  tokens: number;
  /** 음성 파일이 차지한 용량(GB) */
  voiceStorageGb: number;
  /** 자막·요약이 차지한 용량(GB) — ⚠️ 음성과 **나눠서** 보여준다(둘 다 과금 대상) */
  sttStorageGb: number;
  /** 참고 지표 — 청구와 무관하다 */
  meetingCount: number;
}

export interface Subscription {
  planCode: PlanCode;
  planName: string;
  status: SubscriptionStatus;
  /**
   * 지난 주기에서 넘겨 이번에 합산 청구될 금액(원). 없으면 0.
   * ⚠️ 초과는 **그 주기에 바로 받지 않는다** — 다음 결제일에 기본요금과 합쳐 청구된다(팀 결정).
   */
  carriedOverageAmount: number;
  /** 이번 주기 시작일 — 사용량·예측의 기준점 */
  currentPeriodStart: string;
  /** 다음 결제일. 결제 전·만료면 `null` */
  nextBillingDate: string | null;
  /**
   * 다음 결제일에 청구될 예상 금액(원) = **(기본료 + 이월 초과분) + VAT**.
   *
   * ⚠️ **VAT를 포함한다**(2026-08-04 확정). 결제 화면이 `기본료 + VAT`를 그대로 청구하는데
   *    여기만 VAT를 빼면, 같은 구독을 두 화면이 다른 금액으로 말한다 —
   *    화면에 적는 건 **실제로 빠져나가는 금액**이어야 한다(§정직성).
   * ⚠️ 인원과 무관하다. 좌석 과금을 걷어낸 뒤(2026-08-04) 금액을 움직이는 건 사용량뿐이다.
   * ⚠️ **프론트가 계산하지 않는다.** BE가 내려준 값을 그대로 그린다.
   */
  estimatedAmount: number;
  /** 해지하면 언제까지 쓸 수 있는지 — `CANCELING`이 아니어도 안내에 쓴다 */
  currentPeriodEnd: string;
  usage: UsageCounters;
}

/* ───────── 결제 수단 ───────── */

/**
 * 등록된 카드 — **회사당 한 장뿐이다**(2026-08-05 확정).
 *
 * ⚠️ 목록이 아니다. 구독이 회사당 하나이고 청구도 한 번이라 **두 번째 카드가 나갈 자리가 없다** —
 *    여러 장을 두면 `기본` 지정·삭제 금지 규칙이 따라붙는데, 정작 결제는 한 장으로만 나간다.
 * ⚠️ 그래서 `isDefault`가 없다. 한 장뿐이면 늘 그 장이다.
 * ⚠️ 카드를 바꾸는 건 **더하는 게 아니라 갈아 끼우는 일**이다(BE도 빌링키 1:1).
 */
export interface PaymentMethod {
  id: string;
  /** 카드 브랜드 표기 — `VISA` 처럼 그대로 나간다 */
  brand: string;
  /** 뒤 4자리만. **전체 번호는 프론트가 받지 않는다** */
  last4: string;
  /** `09/27` */
  expiry: string;
}

/* ───────── 결제 내역 ───────── */

export const PAYMENT_STATUS = {
  PAID: "PAID",
  FAILED: "FAILED",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PAID: "완료",
  FAILED: "실패",
};

export interface PaymentRecord {
  id: string;
  /** 결제일 ISO */
  paidAt: string;
  planName: string;
  /** 그 달 초과분(원). 없으면 0 — 기본료만 나간 달이다 */
  overageAmount: number;
  /** 청구액(원) */
  amount: number;
  status: PaymentStatus;
}

/** 화면 한 장이 필요로 하는 전부 — 세 탭이 같은 요청 하나로 채워진다 */
export interface BillingOverview {
  subscription: Subscription;
  /** 등록된 카드 — 아직 없으면 `null` */
  method: PaymentMethod | null;
  payments: readonly PaymentRecord[];
}
