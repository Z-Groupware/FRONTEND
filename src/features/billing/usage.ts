import { daysBetween } from "./pricing";
import type { UsageCounters } from "./subscription";
import type { BillingConfig } from "./types";

/**
 * 사용량 — **청구 지표**다.
 *
 * 기본료에 포함량이 딸려 오고, 넘긴 만큼만 금액으로 표기한다.
 * 축은 둘뿐이다 — **① AI 토큰 ② 스토리지(음성 + 자막·요약)**.
 *
 * ⚠️ **초과해도 막지 않는다**(팀 확정). 결제 유도도 하지 않는다 —
 *    "이만큼 넘었고 금액이면 ₩X"까지만 보여준다.
 * ⚠️ 여기 계산은 전부 **표시용**이다. 실제 청구는 서버가 정한다.
 */

/**
 * 축마다 성격이 다르다 — **토큰은 주기마다 0으로 돌아가고, 스토리지는 쌓인다.**
 *
 * ⚠️ 이걸 같게 다루면 예측이 터진다. 스토리지에 "쓴 양 ÷ 지난 일수 × 주기 일수"를 쓰면
 *    **지난 달까지 쌓여 있던 40GB까지 이번 주기에 쓴 것으로 보고 곱한다.**
 */
const USAGE_KIND = {
  /** 주기마다 0에서 다시 시작한다 */
  RESET: "RESET",
  /** 지우기 전까지 계속 쌓인다 */
  CUMULATIVE: "CUMULATIVE",
} as const;

type UsageKind = (typeof USAGE_KIND)[keyof typeof USAGE_KIND];

/** 어느 축이 얼마나 남았는지 — 화면 한 줄이 필요로 하는 전부 */
export interface UsageAxis {
  /** 화면에 그대로 나가는 이름 — `AI 토큰`·`저장 공간` */
  label: string;
  kind: UsageKind;
  used: number;
  /** 기본료에 포함된 양 */
  included: number;
  /** 소진율(0~1). 넘기면 1보다 커진다 — **1로 자르지 않는다**, 얼마나 넘겼는지가 중요하다 */
  ratio: number;
  /**
   * 이번 주기가 끝날 때의 예상 사용량.
   *
   * ⚠️ **양만 쓴다. 금액으로 바꾸지 않는다.** 지난 며칠로 늘려 잡은 추정이라 주기 초반일수록
   *    크게 흔들리고, 서버가 실제로 청구하는 값과 다를 수 있다 — 틀릴 수 있는 금액을 먼저
   *    말하면 그게 약속이 된다(§정직성). 돈은 **실제로 넘긴 뒤**(`overageAmount`)에만 말한다.
   * ⚠️ BE가 추정 금액을 내려 주기로 하면 그 값을 받아 쓴다 — 우리가 계산하지 않는다.
   */
  forecast: number;
  /** 지금까지 넘긴 양. 아직 안 넘겼으면 0 */
  overage: number;
  /** 넘긴 만큼의 금액(원) — **표시용**이고 실제 청구는 서버가 한다 */
  overageAmount: number;
}

interface Period {
  periodStart: string;
  periodEnd: string;
  today: string;
}

/**
 * 이번 주기가 끝날 때 얼마나 쓰게 될지.
 *
 * - **리셋되는 축**(토큰): `쓴 양 ÷ 지난 일수 × 주기 일수`
 * - **쌓이는 축**(스토리지): `지금 총량 + 이번 주기 증가분 ÷ 지난 일수 × 남은 일수`
 *
 * ⚠️ 두 식을 하나로 쓰면 안 된다. 스토리지에 리셋 식을 쓰면 이미 쌓여 있던 양까지 곱해져
 *    "395GB 예상" 같은 숫자가 뜬다.
 * ⚠️ 주기 첫날은 지난 일수가 0이라 나눌 수 없다 — 그때는 **지금 값을 그대로** 둔다.
 *    0으로 나눠 `Infinity`가 화면까지 가면 "∞GB 예상"이 뜬다.
 */
function forecastUsage(params: {
  used: number;
  kind: UsageKind;
  /** 쌓이는 축에서 **이번 주기에 늘어난 양**. 리셋되는 축은 쓰지 않는다 */
  addedThisPeriod?: number;
  period: Period;
}): number {
  const { used, kind, addedThisPeriod = 0, period } = params;

  const cycleDays = daysBetween(period.periodStart, period.periodEnd);
  const elapsedDays = Math.min(daysBetween(period.periodStart, period.today), cycleDays);
  if (elapsedDays <= 0 || cycleDays <= 0) return used;

  if (kind === USAGE_KIND.RESET) {
    return Math.round((used / elapsedDays) * cycleDays);
  }

  const remainingDays = cycleDays - elapsedDays;
  return Math.round(used + (addedThisPeriod / elapsedDays) * remainingDays);
}

/**
 * 넘긴 만큼의 금액.
 *
 * ⚠️ **단위당 단가를 비례로** 매긴다. 토큰은 1,000개당, 스토리지는 1GB당이라
 *    조금 넘겨도 한 묶음을 통째로 받지 않는다.
 */
function calculateOverageAmount(params: {
  overage: number;
  /** 단가가 걸리는 단위 — 토큰이면 1,000, 스토리지면 1 */
  unitSize: number;
  /** 단위당 금액(원) */
  unitRate: number;
}): number {
  const { overage, unitSize, unitRate } = params;
  if (overage <= 0 || unitSize <= 0) return 0;

  return Math.round((overage / unitSize) * unitRate);
}

function toAxis(params: {
  label: string;
  kind: UsageKind;
  used: number;
  included: number;
  addedThisPeriod?: number;
  unitSize: number;
  unitRate: number;
  period: Period;
}): UsageAxis {
  const { label, kind, used, included, addedThisPeriod, unitSize, unitRate, period } = params;
  const overage = Math.max(0, used - included);
  const forecast = forecastUsage({ used, kind, addedThisPeriod, period });

  return {
    label,
    kind,
    used,
    included,
    // 포함량이 0이면 나눌 수 없다 — 쓴 게 있으면 전부 초과로 본다
    ratio: included > 0 ? used / included : used > 0 ? 1 : 0,
    forecast,
    overage,
    overageAmount: calculateOverageAmount({ overage, unitSize, unitRate }),
  };
}

/** 이번 주기 사용 현황 두 축 — 화면은 이 결과만 본다 */
export function buildUsage(params: {
  config: BillingConfig;
  usage: UsageCounters;
  period: Period;
}): {
  tokens: UsageAxis;
  storage: UsageAxis;
  overageTotal: number;
} {
  const { config, usage, period } = params;

  const tokens = toAxis({
    label: "AI 토큰",
    kind: USAGE_KIND.RESET,
    used: usage.tokens,
    included: config.includedTokens,
    unitSize: 1_000,
    unitRate: config.overagePerThousandTokens,
    period,
  });

  const storage = toAxis({
    label: "저장 공간",
    kind: USAGE_KIND.CUMULATIVE,
    used: usage.voiceStorageGb + usage.sttStorageGb,
    included: config.includedStorageGb,
    addedThisPeriod: usage.addedStorageGbThisPeriod,
    unitSize: 1,
    unitRate: config.overagePerGbMonth,
    period,
  });

  return {
    tokens,
    storage,
    overageTotal: tokens.overageAmount + storage.overageAmount,
  };
}

/**
 * 경고를 띄울 문턱 — 소진율 80%.
 *
 * ⚠️ 넘긴 뒤에 알리면 늦다. 회의를 미루거나 음성을 지우는 선택지가 남아 있을 때 알려야 한다.
 */
export const USAGE_WARN_RATIO = 0.8;

export function shouldWarnUsage(axis: UsageAxis): boolean {
  return axis.ratio >= USAGE_WARN_RATIO;
}
