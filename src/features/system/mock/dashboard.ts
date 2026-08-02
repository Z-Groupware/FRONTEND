import { PLAN } from "@/constants/domain";

import type { DashboardOverview } from "../types";

/** ⚠️ 목 데이터 — BE 연동 전. SYSTEM 대시보드 진입 시 보여줄 예시 값이다. */
export const MOCK_DASHBOARD_OVERVIEW: DashboardOverview = {
  summary: {
    companyCount: 62,
    companyCountDeltaThisMonth: 8,
    activeUserCount: 841,
    activeUserDeltaPercent: 12,
    mrr: 8_400_000,
    teamPlanCompanyCount: 38,
    pendingApprovalCount: 3,
  },
  monthlySignups: [
    { month: "2월", count: 3 },
    { month: "3월", count: 5 },
    { month: "4월", count: 7 },
    { month: "5월", count: 8 },
    { month: "6월", count: 10 },
    { month: "7월", count: 8 },
  ],
  planDistribution: [
    { plan: PLAN.TEAM, companyCount: 38 },
    { plan: PLAN.FREE, companyCount: 24 },
  ],
  recentCompanies: [
    { id: "1", name: "(주)테크스타트", plan: PLAN.TEAM, memberCount: 12, joinedAt: "2025-07-22" },
    { id: "2", name: "그린로직스", plan: PLAN.FREE, memberCount: 4, joinedAt: "2025-07-21" },
    { id: "3", name: "(주)레이어원", plan: PLAN.TEAM, memberCount: 27, joinedAt: "2025-07-19" },
    { id: "4", name: "모멘텀랩", plan: PLAN.TEAM, memberCount: 8, joinedAt: "2025-07-17" },
    { id: "5", name: "엔드포인트", plan: PLAN.FREE, memberCount: 3, joinedAt: "2025-07-15" },
    { id: "6", name: "(주)블루스톤", plan: PLAN.TEAM, memberCount: 14, joinedAt: "2025-07-13" },
  ],
};
