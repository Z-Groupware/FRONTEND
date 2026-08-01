import "server-only";

import { isMock } from "@/mocks/config";

import { MOCK_DASHBOARD_OVERVIEW } from "./mock/dashboard";
import type { DashboardOverview } from "./types";

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
