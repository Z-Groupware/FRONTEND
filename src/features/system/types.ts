import type { CompanySize, CompanyStatus, PaymentStatus, Plan } from "@/constants/domain";

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

/** "기업 관리" 목록·상세가 함께 쓰는 한 기업. */
export interface ManagedCompany {
  id: string;
  name: string;
  /** 화면에 그대로 나가는 식별 코드(가입 승인 시 발급) — 검색 대상이기도 하다 */
  code: string;
  size: CompanySize;
  plan: Plan;
  memberCount: number;
  /** 이번 달 회의 횟수 */
  meetingCountThisMonth: number;
  status: CompanyStatus;
  /** "YYYY-MM-DD" */
  joinedAt: string;
  ownerEmail: string;
}

/** 구독·매출 상단 통계 4종. */
export interface BillingSummary {
  /** 이번 달 월 반복 매출(원) */
  mrr: number;
  /** 전월 대비 증감률(%) */
  mrrDeltaPercent: number;
  /** 결제 완료 건수 */
  paidCount: number;
  /** 결제 완료 건 합계(원) — 통계 카드의 보조 문구용 */
  paidAmount: number;
  unpaidCount: number;
  /** 이번 달 해지 건수 */
  canceledCountThisMonth: number;
}

/** 월별 MRR 추이 — 막대그래프 한 칸. */
export interface MonthlyMrr {
  /** 화면에 그대로 나가는 월 라벨("2월" 등) */
  month: string;
  amount: number;
}

/** 구독·매출 목록 한 행. */
export interface SubscriptionRecord {
  companyId: string;
  companyName: string;
  plan: Plan;
  memberCount: number;
  /** 이번 결제 금액(원) — Free 플랜은 0 */
  amount: number;
  /** "YYYY-MM-DD" | null — Free 플랜은 결제일이 없다 */
  billingDate: string | null;
  paymentStatus: PaymentStatus;
  /** 미납 기업에 안내 메일을 보낼 대상 — 승인 시 발급된 오너 이메일과 같다 */
  ownerEmail: string;
  /** 정렬 기준(최신 가입순 보충 표시용) — 화면에는 안 나간다 */
  joinedAt: string;
}

/** 구독·매출 화면 하나가 필요로 하는 데이터 전부 — 격리막의 UI 계약. */
export interface BillingOverview {
  summary: BillingSummary;
  monthlyMrr: MonthlyMrr[];
  /** 항상 5건 — 미납 우선, 모자라면 최신 가입순으로 채운다(화면 명세) */
  subscriptions: SubscriptionRecord[];
}
