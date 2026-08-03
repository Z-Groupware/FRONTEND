import "server-only";

import type { CompanySize, CompanyStatus } from "@/constants/domain";
import { paginate, type PaginatedResult } from "@/lib/paginate";
import { isMock } from "@/mocks/config";

import { findMockPendingApproval, listMockPendingApprovals } from "./mock/approvals";
import { MOCK_BILLING_OVERVIEW } from "./mock/billing";
import { findMockCompany, listMockCompanies, setMockCompanyStatus } from "./mock/companies";
import { MOCK_DASHBOARD_OVERVIEW } from "./mock/dashboard";
import type {
  BillingOverview,
  DashboardOverview,
  ManagedCompany,
  PendingCompanyApproval,
} from "./types";

/**
 * SYSTEM 대시보드 조회 — **격리막**(CLAUDE.md).
 * 컴포넌트는 `DashboardOverview`(UI 계약)만 알고, 목/실서버 분기는 여기서 끝낸다.
 * 연동할 때 고칠 곳은 이 파일과 매퍼뿐이고 컴포넌트는 건드리지 않는다.
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  if (isMock) return MOCK_DASHBOARD_OVERVIEW;

  // ⚠️ 미구현 — API 스펙 확정 후 `ep.systemDashboard()`로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("대시보드 조회 API가 아직 연결되지 않았습니다.");
}

/**
 * 승인 대기 기업 목록 — 페이지 단위로 잘라 돌려준다.
 * ⚠️ 이 화면은 프로젝트 기간 내내 목으로 남을 가능성이 크다(팀 합의) — 그래도 격리막은 유지한다.
 */
export async function getPendingApprovals(
  page: number,
  pageSize: number,
): Promise<PaginatedResult<PendingCompanyApproval>> {
  if (isMock) return paginate(listMockPendingApprovals(), page, pageSize);

  // ⚠️ 미구현 — API 스펙 확정 후 `ep.systemDashboard()`류 경로로 fetch하고 매퍼로 맞춘다.
  throw new Error("기업 승인 목록 API가 아직 연결되지 않았습니다.");
}

export async function getPendingApprovalById(id: string): Promise<PendingCompanyApproval | null> {
  if (isMock) return findMockPendingApproval(id);

  throw new Error("기업 승인 상세 API가 아직 연결되지 않았습니다.");
}

/** "기업 관리" 목록 검색 조건 — 전부 선택값이라 없으면 전체를 대상으로 한다. */
export interface CompanyListFilter {
  /** 기업명 또는 코드 부분 일치(대소문자 무시) */
  keyword?: string;
  size?: CompanySize;
  status?: CompanyStatus;
}

function matchesFilter(company: ManagedCompany, filter: CompanyListFilter): boolean {
  if (filter.size && company.size !== filter.size) return false;
  if (filter.status && company.status !== filter.status) return false;

  if (filter.keyword) {
    const keyword = filter.keyword.trim().toLowerCase();
    if (keyword) {
      const matchesName = company.name.toLowerCase().includes(keyword);
      const matchesCode = company.code.toLowerCase().includes(keyword);
      if (!matchesName && !matchesCode) return false;
    }
  }

  return true;
}

/**
 * 기업 관리 목록 — 검색·필터 후 페이지 단위로 잘라 돌려준다.
 * ⚠️ 검색·필터는 서버에서 계산한다 — 목록이 무한히 늘어날 수 있어(CLAUDE.md §성능) 클라이언트로
 *    전체를 내려보내고 거르면 안 된다. 지금은 목 배열을 거르지만 자리(함수 시그니처)는 실서버와 같다.
 */
export async function getManagedCompanies(
  filter: CompanyListFilter,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<ManagedCompany>> {
  if (isMock) {
    const filtered = listMockCompanies().filter((company) => matchesFilter(company, filter));
    return paginate(filtered, page, pageSize);
  }

  // ⚠️ 미구현 — API 스펙 확정 후 `ep.systemDashboard()`류 경로로 fetch하고 매퍼로 맞춘다.
  throw new Error("기업 관리 목록 API가 아직 연결되지 않았습니다.");
}

export async function getManagedCompanyById(id: string): Promise<ManagedCompany | null> {
  if (isMock) return findMockCompany(id);

  throw new Error("기업 상세 API가 아직 연결되지 않았습니다.");
}

export async function setCompanyStatus(
  id: string,
  status: CompanyStatus,
): Promise<ManagedCompany | null> {
  if (isMock) return setMockCompanyStatus(id, status);

  throw new Error("기업 상태 변경 API가 아직 연결되지 않았습니다.");
}

/**
 * SYSTEM 구독·매출 조회 — **격리막**(CLAUDE.md).
 * ⚠️ 이 화면은 프로젝트 기간 내내 목으로 남을 가능성이 크다(팀 합의) — 그래도 격리막은 유지한다.
 */
export async function getBillingOverview(): Promise<BillingOverview> {
  if (isMock) return MOCK_BILLING_OVERVIEW;

  // ⚠️ 미구현 — API 스펙 확정 후 `ep.systemDashboard()`류 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("구독·매출 조회 API가 아직 연결되지 않았습니다.");
}
