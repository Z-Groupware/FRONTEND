import { ACTION_STATUS, AUTHORITY } from "@/constants/domain";
import {
  TEAM_ACTION_DETAIL_MOCK,
  TEAM_ACTION_PERSONAL_ITEMS_MOCK,
} from "@/features/project/mock/team-action-detail";
import { TEAM_MEMBER_ROSTER_MOCK } from "@/features/team/members/mock/roster";

import { HANDOVER_PREVIEW, type HandoverPreview } from "./lib";
import type { HandoverActionItem, HandoverApplicant, HandoverContext } from "./types";

/**
 * ⚠️ 새 mock 데이터를 만들지 않는다 — `TEAM_ACTION_PERSONAL_ITEMS_MOCK`(project 피처)이
 * 담당자별 개인 액션의 정본이고(보드·팀원 관리도 이걸 쓴다), 팀원 명단은
 * `TEAM_MEMBER_ROSTER_MOCK`(team/members 피처)을 그대로 쓴다. 두 벌을 따로 두면
 * 화면마다 같은 사람의 액션·명단이 어긋난다.
 */
const APPLICANT_NAME_BY_PREVIEW: Record<HandoverPreview, string> = {
  member: "이하윤",
  leader: "김서준",
};

function buildActions(memberName: string): HandoverActionItem[] {
  const actions: HandoverActionItem[] = [];
  for (const [teamActionId, items] of Object.entries(TEAM_ACTION_PERSONAL_ITEMS_MOCK)) {
    const parent = TEAM_ACTION_DETAIL_MOCK[Number(teamActionId)];
    if (!parent) continue;
    for (const item of items) {
      if (item.assigneeName !== memberName) continue;
      // ⚠️ 완료 액션은 인계 대상이 아니다(WORKFLOW.md §7) — 조회 단계에서 아예 뺀다.
      if (item.status === ACTION_STATUS.DONE) continue;
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

export async function getHandoverContext(preview: HandoverPreview): Promise<HandoverContext> {
  const applicantName = APPLICANT_NAME_BY_PREVIEW[preview];
  const roster = TEAM_MEMBER_ROSTER_MOCK.find((member) => member.name === applicantName);
  if (!roster) throw new Error("mock 데이터 오류 — 로스터에 없는 미리보기 인물입니다.");

  const applicant: HandoverApplicant = {
    id: roster.id,
    name: roster.name,
    role: preview === HANDOVER_PREVIEW.LEADER ? AUTHORITY.LEADER : AUTHORITY.MEMBER,
    teamName: roster.teamName,
  };

  const actions = buildActions(applicant.name);

  // ⚠️ 팀장 본인 휴직의 자가 재할당 대상 — 본인 제외 같은 팀원(WORKFLOW.md §7 "팀장 본인 휴직").
  const teammates =
    applicant.role === AUTHORITY.LEADER
      ? TEAM_MEMBER_ROSTER_MOCK.filter((member) => member.name !== applicant.name).map(
          (member) => ({
            id: member.id,
            name: member.name,
            position: member.position,
            role: member.role,
          }),
        )
      : [];

  return { applicant, actions, teammates };
}
