import "server-only";

import { ACTION_STATUS, AUTHORITY } from "@/constants/domain";
import { isVisibleMemberStatus } from "@/constants/member";
import type { BeActionSummary } from "@/features/action/mapper";
import { requireAccessToken } from "@/features/auth/session";
import type { BePageResponse } from "@/features/project/mapper";
import {
  TEAM_ACTION_DETAIL_MOCK,
  TEAM_ACTION_PERSONAL_ITEMS_MOCK,
} from "@/features/project/mock/team-action-detail";
import { getViewer } from "@/features/shell/viewer";
import { TEAM_MEMBER_ROSTER_MOCK } from "@/features/team/members/mock/roster";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { HANDOVER_PREVIEW, type HandoverPreview } from "./lib";
import type {
  HandoverActionItem,
  HandoverApplicant,
  HandoverContext,
  HandoverTeammateOption,
} from "./types";

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

/** 담당 액션 select류 상한 — `rooms/server.ts`의 `RESERVABLE_PROJECTS_PAGE_SIZE`와 같은 패턴. */
const HANDOVER_ACTIONS_PAGE_SIZE = 200;

/**
 * 실서버 — 내 담당 액션 전체(완료 제외). `GET /api/actions`가 토큰의 본인 소유 PERSONAL만
 * 주므로 담당자를 따로 안 걸러도 된다(`action/server.ts`의 `getMyActionsPage`와 같은 전제).
 * ⚠️ `MyActionListItem`(내 액션 화면 계약)을 재사용하지 않는다 — 이 화면엔
 *    `parentTeamActionName`(BE `parentActionTitle`)이 필요한데 그쪽 계약엔 없어서, 굳이
 *    맞추려면 안 쓰는 화면까지 필드가 늘어난다. 여기서 직접 BE 응답을 받아 필요한 만큼만 뽑는다.
 */
async function fetchMyHandoverActions(accessToken: string): Promise<HandoverActionItem[]> {
  const response = await serverApi<BePageResponse<BeActionSummary>>(
    ep.actions({ sort: "dueDate", order: "asc", page: 0, size: HANDOVER_ACTIONS_PAGE_SIZE }),
    { accessToken },
  );
  return response.content
    .filter((action) => action.actionType === "PERSONAL" && action.status !== ACTION_STATUS.DONE)
    .map((action) => ({
      id: action.id,
      projectTag: action.projectTag ?? "",
      parentTeamActionName: action.parentActionTitle ?? "",
      title: action.title,
      status: action.status,
      dueDate: action.dueDate,
    }));
}

/** [확인] `GET /api/team/members` 응답 — `team-handover/server.ts`의 `BeTeamMemberStatus`와 같은 계약. */
interface BeTeamMember {
  memberId: number;
  name: string;
  positionName: string | null;
  roleName: string | null;
  status: string;
}

/**
 * 실서버 — 팀장 본인 휴직의 자가 재할당 대상(본인 제외, 같은 팀).
 * ⚠️ `GET /api/team/members`는 **호출자 토큰의 팀만** 돌려주는 LEADER 전용 엔드포인트다
 *    (`team-handover/server.ts`와 동일 근거) — 그래서 이 화면에서 신청자가 실제로 LEADER일
 *    때만 부른다, MEMBER면 호출 자체를 안 한다(403을 미리 피한다).
 * ⚠️ 퇴사자는 거르고 그 외 상태는 남긴다(`isVisibleMemberStatus`) — 소프트 딜리트만 빠진다.
 */
async function fetchTeammatesForSelfReassign(
  accessToken: string,
  viewerId: number,
): Promise<HandoverTeammateOption[]> {
  const members = await serverApi<BeTeamMember[]>(ep.teamMembers(), { accessToken });
  return members
    .filter((member) => member.memberId !== viewerId && isVisibleMemberStatus(member.status))
    .map((member) => ({
      id: member.memberId,
      name: member.name,
      position: member.positionName ?? "",
      role: member.roleName ?? "",
    }));
}

export async function getHandoverContext(preview: HandoverPreview): Promise<HandoverContext> {
  if (!isMock) {
    const viewer = await getViewer();
    const accessToken = await requireAccessToken();

    const applicant: HandoverApplicant = {
      id: viewer.id,
      name: viewer.name,
      role: viewer.role,
      teamName: viewer.teamName ?? "",
    };

    const [actions, teammates] = await Promise.all([
      fetchMyHandoverActions(accessToken),
      applicant.role === AUTHORITY.LEADER
        ? fetchTeammatesForSelfReassign(accessToken, viewer.id)
        : Promise.resolve([]),
    ]);

    return { applicant, actions, teammates };
  }

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

  /*
    ⚠️ 팀장 본인 휴직의 자가 재할당 대상 — **같은 팀** 소속(본인 제외)만(WORKFLOW.md §7
       "팀장 본인 휴직", 2026-08-09 재확인). 지금은 로스터 mock이 개발팀 한 팀뿐이라
       `teamName` 필터가 없어도 우연히 같은 팀만 나왔었다 — 다른 팀이 로스터에 추가되는
       순간 타 팀원이 조용히 새어 들어갈 수 있어 명시적으로 건다.
  */
  const teammates =
    applicant.role === AUTHORITY.LEADER
      ? TEAM_MEMBER_ROSTER_MOCK.filter(
          (member) => member.teamName === applicant.teamName && member.name !== applicant.name,
        ).map((member) => ({
          id: member.id,
          name: member.name,
          position: member.position,
          role: member.role,
        }))
      : [];

  return { applicant, actions, teammates };
}
