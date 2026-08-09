import "server-only";

import { ACTION_STATUS } from "@/constants/domain";
import { getManagedMember, listManagedMembers } from "@/features/member/manage-server";
import {
  TEAM_ACTION_DETAIL_MOCK,
  TEAM_ACTION_PERSONAL_ITEMS_MOCK,
} from "@/features/project/mock/team-action-detail";

import type { TeamHandoverAction, TeamHandoverDetail, TeamHandoverListItem } from "./types";

/**
 * ⚠️ 세션이 아직 없다(`getViewer()`는 항상 OWNER를 반환) — `/team/(dashboard)`와 같은 이유로
 *    이 스코프는 지금 고정이다(김서준 · 개발팀). 세션이 붙으면 `canApproveMid(viewer, {teamId})`로
 *    게이트하고 이 상수 대신 `viewer.teamName`/`viewer.id`를 쓴다.
 */
export const FIXED_LEADER_ID = 2;
export const FIXED_LEADER_NAME = "김서준";
const FIXED_TEAM_NAME = "개발팀";

/**
 * 타임라인용 "인계 액션" — `member/mock/managed.ts`의 개인 액션 목록은 `startDate`가 없어
 * 기간 바를 못 그린다. 대신 `leader-handover`가 쓴 것과 같은 소스(`TEAM_ACTION_PERSONAL_ITEMS_MOCK`)
 * 에서 이 신청자 명의 항목만 골라 쓴다(완료 건은 재배정 대상이 아니라 뺀다).
 */
function buildHandoverActions(memberName: string): TeamHandoverAction[] {
  const actions: TeamHandoverAction[] = [];
  for (const [teamActionId, items] of Object.entries(TEAM_ACTION_PERSONAL_ITEMS_MOCK)) {
    const parent = TEAM_ACTION_DETAIL_MOCK[Number(teamActionId)];
    if (!parent) continue;
    for (const item of items) {
      if (item.assigneeName !== memberName) continue;
      if (item.status === ACTION_STATUS.DONE) continue;
      actions.push({
        id: item.id,
        projectTag: parent.projectTag,
        parentTeamActionName: parent.name,
        title: item.title,
        status: item.status,
        startDate: item.startDate,
        dueDate: item.dueDate,
      });
    }
  }
  return actions;
}

/** 목록 — 팀장 중간 승인을 기다리는 팀원 신청만(이미 승인된 건은 여기서 할 일이 없다). */
export async function listTeamHandovers(): Promise<TeamHandoverListItem[]> {
  const members = await listManagedMembers();
  const teammates = members.filter(
    (member) => member.teamName === FIXED_TEAM_NAME && member.id !== FIXED_LEADER_ID,
  );

  const details = await Promise.all(teammates.map((member) => getManagedMember(member.id)));

  return details
    .filter(
      (detail) => detail !== null && detail.pendingHandover && !detail.pendingHandover.midApproval,
    )
    .map((detail) => {
      const member = detail!.member;
      const handover = detail!.pendingHandover!;
      return {
        id: String(member.id),
        memberId: member.id,
        memberName: member.name,
        type: handover.type,
        period: handover.period,
        actionCount: handover.actionCount,
      };
    });
}

/** 상세 — 이미 중간 승인됐거나 신청이 없으면 `null`(화면이 `notFound()`를 부른다). */
export async function getTeamHandoverDetail(memberId: number): Promise<TeamHandoverDetail | null> {
  const detail = await getManagedMember(memberId);
  if (!detail || detail.member.teamName !== FIXED_TEAM_NAME) return null;

  const handover = detail.pendingHandover;
  if (!handover || handover.midApproval) return null;

  const members = await listManagedMembers();
  const teammates = members
    .filter((member) => member.teamName === FIXED_TEAM_NAME && member.id !== memberId)
    .map((member) => ({ id: member.id, name: member.name, roleLabel: member.roleLabel }));

  return {
    id: String(memberId),
    memberId,
    memberName: detail.member.name,
    type: handover.type,
    period: handover.period,
    actionCount: handover.actionCount,
    actions: buildHandoverActions(detail.member.name),
    teammates,
  };
}
