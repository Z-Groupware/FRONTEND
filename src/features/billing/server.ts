import "server-only";

import type { BillingConfig } from "./config";
import {
  type BillingOverview,
  PAYMENT_STATUS,
  type Subscription,
  SUBSCRIPTION_STATUS,
} from "./subscription";
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
const isMock = true;

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
        ⚠️ **토큰은 주기 초반 며칠치**로 둔다 — 주기 전체를 쓴 양을 넣으면 예측이 10배로 튄다.
        ⚠️ **스토리지는 쌓인 총량**이다. 지난 달까지 쌓인 게 대부분이고, 이번 주기 증가분은
           따로 담는다(`addedStorageGbThisPeriod`) — 이게 없으면 늘어나는 속도를 알 수 없다.
      */
      tokens: 186_000,
      voiceStorageGb: 34.9,
      sttStorageGb: 6.8,
      addedStorageGbThisPeriod: 1.2,
      meetingCount: 6,
    },
  },
  methods: [{ id: "pm_1", brand: "VISA", last4: "4242", expiry: "09/27", isDefault: true }],
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
    addedStorageGbThisPeriod: 0,
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

export async function getBillingConfig(): Promise<BillingConfig> {
  if (isMock) return MOCK_CONFIG;

  // TODO(BE 연동): GET /companies/me/billing-config — 실측값이 나오면 여기서 받는다.
  throw new Error("요금 설정 API가 아직 연결되지 않았습니다.");
}

export async function getOnboardingSubscription(): Promise<Subscription> {
  if (isMock) return MOCK_PENDING;

  // TODO(BE 연동): GET /companies/me/subscription — 온보딩 직후엔 `UNPAID`로 내려온다.
  throw new Error("구독 API가 아직 연결되지 않았습니다.");
}

export async function getBillingOverview(): Promise<BillingOverview> {
  if (isMock) return MOCK;

  // TODO(BE 연동): GET /companies/me/billing — 응답 shape 확정 후 매퍼를 여기 붙인다.
  //   ⚠️ Swagger·구두 추측으로 만들지 않는다. BE 레포 실코드로 경로·shape을 확인한다(CLAUDE.md §연동 검증).
  throw new Error("구독 API가 아직 연결되지 않았습니다.");
}
