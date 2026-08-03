import type { CompanySize, Plan } from "@/constants/domain";

/** 대시보드 상단 통계 4종. */
export interface DashboardSummary {
  companyCount: number;
  /** 이번 달 신규 가입 기업 수 */
  companyCountDeltaThisMonth: number;
  activeUserCount: number;
  /** 전월 대비 증감률(%) */
  activeUserDeltaPercent: number;
  /** 월 반복 매출(원) */
  mrr: number;
  teamPlanCompanyCount: number;
  pendingApprovalCount: number;
}

/** 월별 신규 가입 기업 수 — 막대그래프 한 칸. */
export interface MonthlySignup {
  /** 화면에 그대로 나가는 월 라벨("2월" 등) */
  month: string;
  count: number;
}

/** 플랜별 기업 수 — 도넛차트 한 조각. */
export interface PlanDistributionSlice {
  plan: Plan;
  companyCount: number;
}

/** 최근 가입 기업 한 행. */
export interface RecentCompany {
  id: string;
  name: string;
  plan: Plan;
  memberCount: number;
  /** "YYYY-MM-DD" — 관리자 화면 표기라 일반 화면의 "8월 5일(화)" 형식을 따르지 않는다 */
  joinedAt: string;
}

/** 대시보드 화면 하나가 필요로 하는 데이터 전부 — 격리막의 UI 계약. */
export interface DashboardOverview {
  summary: DashboardSummary;
  monthlySignups: MonthlySignup[];
  planDistribution: PlanDistributionSlice[];
  recentCompanies: RecentCompany[];
}

/** 기업 가입 승인 대기 신청서 한 건. */
export interface PendingCompanyApproval {
  id: string;
  companyName: string;
  businessRegistrationNumber: string;
  representativeName: string;
  contactEmail: string;
  size: CompanySize;
  /** "YYYY-MM-DD" */
  appliedAt: string;
}
