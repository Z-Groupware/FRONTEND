import "server-only";

import { COMPANY_SORT, type CompanySort, type CompanyStatus } from "@/constants/domain";
import { paginate, type PaginatedResult } from "@/lib/paginate";
import { isMock } from "@/mocks/config";

import { findMockPendingApproval, listMockPendingApprovals } from "./mock/approvals";
import { MOCK_BILLING_OVERVIEW } from "./mock/billing";
import { findMockCompany, listMockCompanies, setMockCompanyStatus } from "./mock/companies";
import { MOCK_DASHBOARD_OVERVIEW } from "./mock/dashboard";
import { MOCK_MONITORING_OVERVIEW } from "./mock/monitoring";
import { MOCK_NOTICE_HISTORY } from "./mock/notices";
import type {
  BillingOverview,
  CompanyListFilter,
  DashboardOverview,
  ManagedCompany,
  MonitoringOverview,
  NoticeHistoryItem,
  NoticeTargetCompany,
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

function matchesFilter(company: ManagedCompany, filter: CompanyListFilter): boolean {
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

/** 정렬 — 구성원수·가입일 기준(규모·플랜 필터를 대신한다). 없으면 최신 가입순. */
function sortCompanies(companies: ManagedCompany[], sort: CompanySort): ManagedCompany[] {
  const sorted = [...companies];
  switch (sort) {
    case COMPANY_SORT.MEMBERS_DESC:
      return sorted.sort((a, b) => b.memberCount - a.memberCount);
    case COMPANY_SORT.MEMBERS_ASC:
      return sorted.sort((a, b) => a.memberCount - b.memberCount);
    case COMPANY_SORT.JOINED_ASC:
      return sorted.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    case COMPANY_SORT.JOINED_DESC:
    default:
      return sorted.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  }
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
    const sorted = sortCompanies(filtered, filter.sort ?? COMPANY_SORT.JOINED_DESC);
    return paginate(sorted, page, pageSize);
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

/**
 * SYSTEM 시스템 모니터링 조회 — **격리막**(CLAUDE.md).
 * 큐 상태·단계 소요·실패 목록은 실서버에선 파이프라인 메트릭/잡 큐에서 온다.
 * ⚠️ 이 화면은 프로젝트 기간 내내 목으로 남을 가능성이 크다(팀 합의) — 그래도 격리막은 유지한다.
 */
export async function getMonitoringOverview(): Promise<MonitoringOverview> {
  if (isMock) return MOCK_MONITORING_OVERVIEW;

  // ⚠️ 미구현 — API 스펙 확정 후 파이프라인 메트릭 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("시스템 모니터링 조회 API가 아직 연결되지 않았습니다.");
}

/**
 * SYSTEM 공지 "발행 이력" 조회 — **격리막**(CLAUDE.md).
 * ⚠️ 이 화면은 프로젝트 기간 내내 목으로 남을 가능성이 크다(팀 합의) — 그래도 격리막은 유지한다.
 */
export async function getNoticeHistory(): Promise<NoticeHistoryItem[]> {
  if (isMock) return MOCK_NOTICE_HISTORY;

  // ⚠️ 미구현 — API 스펙 확정 후 공지 목록 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("공지 이력 조회 API가 아직 연결되지 않았습니다.");
}

/**
 * 공지 "특정 기업" 대상 검색용 기업 목록 — 이름·코드만 가볍게 넘긴다.
 * ⚠️ 지금은 목이라 전체 목록을 내려 클라이언트에서 걸러 보여준다(데모 규모). 실서버는 검색어를
 *    받아 서버에서 좁힌 결과만 내려야 한다(CLAUDE.md §성능: 목록을 통째로 내리지 않는다).
 */
export async function getNoticeTargetCompanies(): Promise<NoticeTargetCompany[]> {
  if (isMock) {
    return listMockCompanies().map((company) => ({
      id: company.id,
      name: company.name,
      code: company.code,
    }));
  }

  throw new Error("공지 대상 기업 조회 API가 아직 연결되지 않았습니다.");
}
