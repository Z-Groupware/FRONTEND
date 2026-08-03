import { COMPANY_STATUS, PAYMENT_STATUS, PLAN } from "@/constants/domain";

import type { BillingOverview, ManagedCompany, SubscriptionRecord } from "../types";
import { listMockCompanies } from "./companies";

/** Team 플랜 1인당 월 단가 — `features/billing/plans.ts`의 시안값과 맞춘다(₩9,900). */
const TEAM_UNIT_PRICE = 9_900;

/** 화면에 보여줄 구독 목록 수 — 화면 명세: 미납 우선, 모자라면 최신 가입순으로 채운다. */
const SUBSCRIPTION_DISPLAY_COUNT = 5;

/** ⚠️ 목 데이터 — BE 연동 전. SYSTEM 구독·매출 진입 시 보여줄 예시 값이다. */
export const MOCK_BILLING_OVERVIEW: BillingOverview = {
  summary: {
    mrr: 8_400_000,
    mrrDeltaPercent: 11.8,
    paidCount: 37,
    paidAmount: 8_400_000,
    unpaidCount: 1,
    canceledCountThisMonth: 2,
  },
  monthlyMrr: [
    { month: "2월", amount: 4_200_000 },
    { month: "3월", amount: 5_100_000 },
    { month: "4월", amount: 6_300_000 },
    { month: "5월", amount: 7_000_000 },
    { month: "6월", amount: 7_600_000 },
    { month: "7월", amount: 8_400_000 },
  ],
  subscriptions: buildMockSubscriptions(),
};

/**
 * 구독 목록 = 기업 관리 목 데이터에서 파생한다 — 두 화면이 같은 기업을 다르게 보여줄 뿐이라
 * 별도 배열을 또 손으로 채우면 언젠가 서로 어긋난다(CLAUDE.md §도메인 상수: 값 목록은 한 곳에서).
 * ⚠️ 화면 명세: **항상 5건만** — 미납 기업을 먼저 채우고, 모자라면 `joinedAt` 최신순으로 채운다.
 */
function buildMockSubscriptions(): SubscriptionRecord[] {
  const toRecord = (company: ManagedCompany): SubscriptionRecord => ({
    companyId: company.id,
    companyName: company.name,
    plan: company.plan,
    memberCount: company.memberCount,
    amount: company.plan === PLAN.TEAM ? company.memberCount * TEAM_UNIT_PRICE : 0,
    billingDate: company.plan === PLAN.TEAM ? "2025-07-01" : null,
    paymentStatus:
      company.status === COMPANY_STATUS.SUSPENDED
        ? PAYMENT_STATUS.CANCELED
        : company.status === COMPANY_STATUS.UNPAID
          ? PAYMENT_STATUS.UNPAID
          : PAYMENT_STATUS.PAID,
    ownerEmail: company.ownerEmail,
    joinedAt: company.joinedAt,
  });

  const companies = listMockCompanies();
  const unpaid = companies.filter((company) => company.status === COMPANY_STATUS.UNPAID);
  const rest = companies
    .filter((company) => company.status !== COMPANY_STATUS.UNPAID)
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));

  return [...unpaid, ...rest].slice(0, SUBSCRIPTION_DISPLAY_COUNT).map(toRecord);
}
