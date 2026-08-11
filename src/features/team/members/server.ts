import {
  TEAM_ACTION_DETAIL_MOCK,
  TEAM_ACTION_PERSONAL_ITEMS_MOCK,
} from "@/features/project/mock/team-action-detail";

import {
  filterTeamMembers,
  sortTeamMembers,
  type TeamMemberFilter,
  type TeamMemberSort,
} from "./lib";
import { TEAM_MEMBER_ROSTER_MOCK } from "./mock/roster";
import type { TeamMemberAction, TeamMemberStatusItem } from "./types";

/**
 * ⚠️ 목 데이터라도 **새 데이터를 안 만든다** — 팀 액션 상세(`project` 피처)의
 * `TEAM_ACTION_PERSONAL_ITEMS_MOCK`이 이미 담당자별 개인 액션의 정본이다(보드도 이걸
 * 그대로 쓴다, `board/server.ts`). 여기서 담당자 이름으로 걸러 모으기만 한다 —
 * 두 벌을 따로 두면 화면마다 같은 사람의 액션 개수가 달라진다.
 */
function buildMemberActions(memberName: string): TeamMemberAction[] {
  const actions: TeamMemberAction[] = [];
  for (const [teamActionId, items] of Object.entries(TEAM_ACTION_PERSONAL_ITEMS_MOCK)) {
    const parent = TEAM_ACTION_DETAIL_MOCK[Number(teamActionId)];
    if (!parent) continue;
    for (const item of items) {
      if (item.assigneeName !== memberName) continue;
      actions.push({
        id: item.id,
        projectTag: parent.projectTag,
        parentTeamActionName: parent.name,
        title: item.title,
        status: item.status,
        dueDate: item.dueDate,
      });
    }
  }
  return actions;
}

/** "팀원 관리" 목록 — 정렬·필터는 서버에서 적용한다(서버우선, `?sort=`·`?filter=`). */
export async function getTeamMemberStatuses(
  sort: TeamMemberSort,
  filter: TeamMemberFilter,
): Promise<TeamMemberStatusItem[]> {
  const members: TeamMemberStatusItem[] = TEAM_MEMBER_ROSTER_MOCK.map((member) => ({
    ...member,
    actions: buildMemberActions(member.name),
  }));

  return sortTeamMembers(filterTeamMembers(members, filter), sort);
}
