import "server-only";

import { paginate, type PaginatedResult } from "@/lib/paginate";
import { isMock } from "@/mocks/config";

import { findMockPendingApproval, listMockPendingApprovals } from "./mock/approvals";
import { MOCK_DASHBOARD_OVERVIEW } from "./mock/dashboard";
import type { DashboardOverview, PendingCompanyApproval } from "./types";

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
