import { MEETING_MAX_ITEMS } from "./lib";
import { TEAM_DASHBOARD_MOCK } from "./mock/dashboard";
import type { TeamDashboardOverview } from "./types";

// ⚠️ ERD·API 스펙 미확정(BE 협의 전) — 지금은 목 고정. 확정되면 이 분기만 손댄다.
const isMock = true;

export async function getTeamDashboardOverview(): Promise<TeamDashboardOverview> {
  if (isMock) {
    return {
      ...TEAM_DASHBOARD_MOCK,
      // 최신순(내림차순)으로 위에서부터. 박스가 이 수에 딱 맞춰 그려지므로 서버도 같은 수로 자른다.
      meetings: [...TEAM_DASHBOARD_MOCK.meetings]
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
        .slice(0, MEETING_MAX_ITEMS),
    };
  }
  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}
