import type { MemberStatus } from "@/constants/domain";
import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { MEETING_MAX_ITEMS } from "./lib";
import { TEAM_DASHBOARD_MOCK } from "./mock/dashboard";
import type { TeamDashboardMember, TeamDashboardOverview } from "./types";

/** [확인] BE `TeamDashboardSummaryResponse` — PR #354 머지 완료. */
interface BeTeamDashboardSummary {
  teamActionCount: number;
  teamMemberActionCount: number;
  myActionCount: number;
  completedActionCount: number;
}

/** [확인] BE `TeamMemberStatusResponse` — PR #354 머지 완료. */
interface BeTeamMemberStatus {
  memberId: number;
  name: string;
  positionName: string | null;
  roleName: string | null;
  status: MemberStatus;
  actionCount: number;
}

function toTeamDashboardMember(be: BeTeamMemberStatus): TeamDashboardMember {
  return {
    id: String(be.memberId),
    name: be.name,
    position: be.positionName ?? "",
    role: be.roleName ?? "없음",
    assignedActionCount: be.actionCount,
    status: be.status,
  };
}

export async function getTeamDashboardOverview(viewer: {
  teamName?: string;
}): Promise<TeamDashboardOverview> {
  if (isMock) {
    return {
      ...TEAM_DASHBOARD_MOCK,
      // 최신순(내림차순)으로 위에서부터. 박스가 이 수에 딱 맞춰 그려지므로 서버도 같은 수로 자른다.
      meetings: [...TEAM_DASHBOARD_MOCK.meetings]
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
        .slice(0, MEETING_MAX_ITEMS),
    };
  }

  const accessToken = await requireAccessToken();
  const [summary, members] = await Promise.all([
    serverApi<BeTeamDashboardSummary>(ep.teamDashboardSummary(), { accessToken }),
    serverApi<BeTeamMemberStatus[]>(ep.teamMembers(), { accessToken }),
  ]);

  return {
    teamName: viewer.teamName ?? "",
    teamActionCount: summary.teamActionCount,
    memberActionCount: summary.teamMemberActionCount,
    myActionCount: summary.myActionCount,
    doneActionCount: summary.completedActionCount,
    members: members.map(toTeamDashboardMember),
    // ⚠️ 최근 팀 회의 API가 아직 BE에 없다(모성진에게 scope=team 요청함, 2026-08-12) —
    //    지어내지 않고 빈 배열로 둔다(§정직성). API 도착하면 이 자리만 고친다.
    meetings: [],
  };
}
