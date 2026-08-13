import "server-only";

import { getAccessToken, requireAccessToken } from "@/features/auth/session";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import {
  parseBillingConfig,
  parseBillingOverview,
  toBillingConfig,
  toBillingOverview,
  toSubscription,
} from "./mapper";
import {
  type BillingOverview,
  PAYMENT_STATUS,
  type Subscription,
  SUBSCRIPTION_STATUS,
} from "./subscription";
import type { BillingConfig } from "./types";
import { PLAN } from "./types";

/**
 * 구독 현황 조회 — **격리막**.
 *
 * ⚠️ 컴포넌트는 이 함수의 반환 타입(`BillingOverview`)만 본다. 연동되면 여기서
 *    `isMock` 분기만 실서버 호출로 바꾸고 매퍼가 shape을 흡수한다 — 화면은 안 바뀐다.
 * ⚠️ ERD·API가 아직 없다(BE 협의 전). 그래서 지금은 **목 하나뿐**이고,
 *    이 값들은 "그럴듯한 예시"가 아니라 **가정한 shape**이다 — 연동 시 매퍼로 맞춘다.
 * ⚠️ 결제 실연동(Toss)이 미정이라 카드 등록·해지는 **화면에서 목이라고 밝힌다**(§정직성).
 */

/** 목 — 12명이 Team을 쓰는 회사 */
const MOCK: BillingOverview = {
  subscription: {
    planCode: PLAN.TEAM,
    planName: "Team",
    status: SUBSCRIPTION_STATUS.ACTIVE,
    /*
      ⚠️ `currentPeriodEnd`는 **갱신일과 같은 날**이다(그날 다음 주기가 시작된다).
         하루 앞으로 적어 두면 일할계산의 주기 일수가 하루 모자라 금액이 어긋난다.
      ⚠️ 목이라 날짜가 고정이다 — 이 날짜가 지나면 사용량 예측이 주기 밖 값으로 계산된다.
         연동되면 BE가 실제 주기를 내려준다.
    */
    currentPeriodStart: "2026-08-01",
    currentPeriodEnd: "2026-09-01",
    nextBillingDate: "2026-09-01",
    estimatedAmount: 165_000,
    carriedOverageAmount: 0,
    /*
      ⚠️ **청구 지표는 AI 사용량과 저장 공간 둘뿐이다.** 회의 건수는 참고용으로만 둔다 —
         과금과 무관한 숫자를 같은 자리에 크게 놓으면 무엇 때문에 돈이 나가는지 흐려진다.
      ⚠️ 저장 공간을 **음성과 자막으로 나눠** 담는다. 둘 다 과금 대상이고, 지울 때
         음성은 권장·자막은 비권장이라 화면에서 갈라 보여야 한다(팀 결정).
    */
    usage: {
      /*
        ⚠️ **스토리지는 쌓인 총량**이다. 지난 달까지 쌓인 게 대부분이다.
      */
      tokens: 186_000,
      voiceStorageGb: 34.9,
      sttStorageGb: 6.8,
      meetingCount: 6,
    },
  },
  method: { id: "pm_1", brand: "VISA", last4: "4242", expiry: "09/27" },
  payments: [
    {
      id: "pay_7",
      paidAt: "2026-08-01",
      planName: "Team",
      overageAmount: 0,
      amount: 165_000,
      status: PAYMENT_STATUS.PAID,
    },
    {
      id: "pay_6",
      paidAt: "2026-07-01",
      planName: "Team",
      overageAmount: 0,
      amount: 165_000,
      status: PAYMENT_STATUS.PAID,
    },
    {
      id: "pay_5",
      paidAt: "2026-06-01",
      planName: "Team",
      overageAmount: 0,
      amount: 165_000,
      status: PAYMENT_STATUS.PAID,
    },
    {
      id: "pay_4",
      paidAt: "2026-05-01",
      planName: "Team",
      overageAmount: 0,
      amount: 165_000,
      status: PAYMENT_STATUS.PAID,
    },
    {
      id: "pay_3",
      paidAt: "2026-04-01",
      planName: "Team",
      // 초과가 난 달 — 기본료에 얹혀 한 번에 청구됐다
      overageAmount: 22_400,
      amount: 187_400,
      status: PAYMENT_STATUS.PAID,
    },
  ],
};

/**
 * 온보딩 4단계가 보는 구독 — **아직 결제 전**이다.
 *
 * ⚠️ 구독 관리 화면과 **같은 목을 쓰면 안 된다.** 저건 이미 결제 중인 회사라
 *    온보딩에서 열면 "변경 사항 없음 · ₩0"이 떠서 결제를 할 수가 없다.
 * ⚠️ 사용량이 전부 0이다. 아직 아무것도 안 썼다 — 결제 화면은 **포함량만** 보여준다.
 */
const MOCK_PENDING: Subscription = {
  ...MOCK.subscription,
  status: SUBSCRIPTION_STATUS.UNPAID,
  nextBillingDate: null,
  estimatedAmount: 0,
  usage: {
    tokens: 0,
    voiceStorageGb: 0,
    sttStorageGb: 0,
    meetingCount: 0,
  },
};

/**
 * **실서버에서** 구독 행이 아직 없을 때의 모습 — 결제 전.
 *
 * ⚠️ `MOCK_PENDING`과 따로 둔다. 저건 목이라 날짜·플랜명이 채워져 있는데, 실서버에서
 *    행이 없다는 건 **주기가 시작된 적이 없다**는 뜻이라 채울 날짜가 없다 —
 *    목값을 실경로로 흘려보내면 결제도 안 한 회사에 "2026-08-01 ~ 09-01"이 뜬다(§정직성).
 * ⚠️ **날짜를 지어내지 않고 빈 문자열로 둔다.** 계약이 `string`이라 `null`을 못 넣는데
 *    (넓히면 컴포넌트를 고쳐야 해서 격리막이 깨진다), 빈 문자열은 화면에서 `—`로 떨어진다
 *    (`usage-panel`의 `periodLabel` → `isReadableDate`).
 * ⚠️ 이 값을 쓰는 화면(게이트 `/subscription`, 온보딩 4단계)은 실제로 **`status`만 읽는다** —
 *    나머지는 계약을 채우려고 있는 자리다.
 */
const PENDING: Subscription = {
  planCode: PLAN.TEAM,
  /* ⚠️ 유일한 플랜 이름이다(BE도 `BillingOverviewService.PLAN_NAME`에 `"Team"`으로 고정). */
  planName: "Team",
  status: SUBSCRIPTION_STATUS.UNPAID,
  carriedOverageAmount: 0,
  currentPeriodStart: "",
  nextBillingDate: null,
  estimatedAmount: 0,
  currentPeriodEnd: "",
  usage: {
    tokens: 0,
    voiceStorageGb: 0,
    sttStorageGb: 0,
    meetingCount: 0,
  },
};

/**
 * 요금 설정 — **BE가 내려주는 값**이다(팀 확정: 하드코딩 금지).
 *
 * ⚠️ 아래 숫자는 **실측 전 v0 가정값**이다. 실측이 나오면 BE 설정만 바꾸고
 *    프론트는 한 줄도 안 고친다 — 그러라고 격리막을 둔 것이다.
 */
const MOCK_CONFIG: BillingConfig = {
  baseFee: 150_000,
  includedTokens: 1_500_000,
  includedStorageGb: 50,
  overagePerThousandTokens: 20,
  overagePerGbMonth: 500,
  isVatIncluded: false,
};

/*
  ⚠️ **BE에 결제·구독 API가 생겼다**(2026-08-13 실코드 대조 — `BillingController`, BIL-0~4).
     2026-08-10에 "BE에 없다"고 적어 둔 자리를 실호출로 바꾼다. 목 분기는 그대로 살아 있다.
  ⚠️ **화면에 "목"이라고 적지는 않는다** — 결제 버튼이 실제로 카드를 긁지 않는다는 사실은
     결제 화면이 따로 말한다(§정직성). PG(Toss)는 여전히 미확정이라 `payment-method.ts`는 목이다.
*/

/**
 * 요금 설정.
 *
 * ⚠️ **로그아웃 화면에서도 불린다.** 공개 요금제 페이지(`/plans`)가 이 함수를 쓰는데,
 *    BE `GET /billing-config`는 `isAuthenticated()`라 토큰 없이는 401이다 —
 *    **BE에 공개 경로를 요청해 둔 상태**이고, 그때까지는 토큰이 없으면 v0 가정값을 그대로 쓴다.
 * ⚠️ **이 되돌림은 값이 어긋나지 않는다.** BE도 회사별 설정 행이 없으면 같은 숫자를 내려준다
 *    (`metering/domain/model/BillingDefaults.java` — 주석에 `v0 assumption, FE mock parity`라고
 *    적혀 있고 여섯 값이 아래와 전부 같다, 2026-08-13 대조). 그래서 로그인 전 화면이
 *    **거짓 금액을 보여 주지는 않는다** — 다만 회사별로 요금을 달리 받기 시작하면
 *    그날부터는 어긋나므로, 공개 경로가 생기기 전에 요금을 커스터마이즈하면 안 된다.
 * ⚠️ 던지지 않는다. 여기서 던지면 **랜딩에서 들어오는 소개 페이지가 통째로 죽는다** —
 *    로그인도 안 한 사람에게 보여 줄 오류가 아니다.
 */
export async function getBillingConfig(): Promise<BillingConfig> {
  if (isMock) return MOCK_CONFIG;

  const accessToken = await getAccessToken();
  if (!accessToken) return MOCK_CONFIG;

  const raw = await serverApi<unknown>(ep.billingConfig(), { accessToken });
  return toBillingConfig(parseBillingConfig(raw));
}

/**
 * 온보딩 4단계·구독 재개 화면이 보는 구독 — **아직 결제 전**이다.
 *
 * ⚠️ **`GET /billing`을 그대로 쓴다.** 결제 전용 조회가 BE에 따로 없다 — 없는 경로를 지어내지
 *    않는다(§환각 API 방지). 상태(`UNPAID`)는 그 응답이 말해 준다.
 * ⚠️ **구독 행이 없으면 404(`BIL-001`)가 온다.** BE에 구독 행을 만드는 코드가 아직 없어서
 *    (`BillingSubscription.create`를 부르는 곳이 없다, 2026-08-13 대조) 갓 온보딩한 회사는
 *    반드시 이 갈래로 떨어진다 — 그 404는 **오류가 아니라 "아직 결제 전"이라는 뜻**이라
 *    결제 전 모습으로 낮춘다. BE도 같은 판정을 한다(`CompanyController.subscriptionStatusOf`가
 *    행이 없으면 `UNPAID`를 내려준다) — 두 곳이 같은 뜻으로 읽는다.
 * ⚠️ **여기서 던지면 흐름이 끊긴다.** 온보딩 [완료]는 되돌릴 수 없고 그 다음 화면이 곧바로
 *    4단계(결제)다 — 커밋은 성공했는데 결제 화면이 에러로 뜨면 사용자는 조직이 저장됐는지조차
 *    알 수 없고, 돌아갈 단계도 없다. 404 말고 다른 실패는 그대로 올린다(진짜 고장이다).
 */
export async function getOnboardingSubscription(): Promise<Subscription> {
  if (isMock) return MOCK_PENDING;

  const accessToken = await requireAccessToken();

  try {
    const raw = await serverApi<unknown>(ep.billing(), { accessToken });
    return toSubscription(parseBillingOverview(raw).subscription);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return PENDING;
    throw error;
  }
}

/**
 * 구독 현황 화면(`/manage/billing`) 한 벌.
 *
 * ⚠️ 여기서는 404를 낮추지 않는다. 이 화면은 **이미 결제한 회사**가 보는 자리라, 구독이 없다는
 *    건 진짜로 뭔가 어긋난 것이다 — 결제 전 회사는 게이트(`/subscription`)가 먼저 잡는다.
 */
export async function getBillingOverview(): Promise<BillingOverview> {
  if (isMock) return MOCK;

  const accessToken = await requireAccessToken();
  const raw = await serverApi<unknown>(ep.billing(), { accessToken });
  return toBillingOverview(parseBillingOverview(raw));
}
