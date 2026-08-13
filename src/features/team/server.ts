import type { MemberStatus } from "@/constants/domain";
import { requireAccessToken } from "@/features/auth/session";
import { parseDashboardMeetings, toDashboardMeetingCard } from "@/features/meeting/mapper";
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
  /*
    ⚠️ **`scope=team`은 LEADER만**이고 토큰에 `teamId`가 있어야 한다(아니면 403·Z-001,
       BE `DashboardMeetingQueryService.validateRoleScope`) — 이 함수는 팀장 대시보드
       (`/team`)에서만 불리므로 그 조건이 라우트 가드로 이미 보장된다.
    ⚠️ 자르는 수는 **화면이 정한다**(`MEETING_MAX_ITEMS`). 박스 높이가 이 수에서 나오므로
       서버가 더 주면 스크롤이 생기고, 덜 주면 카드 바닥이 빈다(§team/lib).
    ⚠️ 셋을 같이 부른다 — 차례로 부르면 대시보드가 세 번 기다린다.
  */
  const [summary, members, meetings] = await Promise.all([
    serverApi<BeTeamDashboardSummary>(ep.teamDashboardSummary(), { accessToken }),
    serverApi<BeTeamMemberStatus[]>(ep.teamMembers(), { accessToken }),
    serverApi<unknown>(ep.meetingsDashboard({ scope: "team", limit: MEETING_MAX_ITEMS }), {
      accessToken,
    }),
  ]);

  return {
    teamName: viewer.teamName ?? "",
    teamActionCount: summary.teamActionCount,
    memberActionCount: summary.teamMemberActionCount,
    myActionCount: summary.myActionCount,
    doneActionCount: summary.completedActionCount,
    members: members.map(toTeamDashboardMember),
    /*
      ⚠️ **정렬은 서버 것을 그대로 쓴다**(MEET-17이 최근 순을 보장한다 — BE 저장소 계약).
         목 경로처럼 여기서 다시 정렬하면 서버가 고른 5건과 우리가 세운 차례가 어긋난다.
      ⚠️ `originLabel`은 `scope=team`에서 **항상 비어 온다**(명세에 정의가 없다고 BE가
         `null`로 둔다) — 매퍼가 키째로 빼고 화면은 그 배지를 안 그린다(§정직성).
    */
    meetings: parseDashboardMeetings(meetings).map(toDashboardMeetingCard),
  };
}
