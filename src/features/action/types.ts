/**
 * 개인 액션 상세(`/app/actions/:actionId`)의 UI 계약.
 * ⚠️ 팀 액션 상세(`TeamActionDetail`)와 거의 같은 모양이다 — 다른 점 둘뿐:
 *   ① 담당자가 팀장이 아니라 **그 사람 본인**이라 역할 라벨이 다양하다("프론트엔드" 등).
 *   ② 상위 팀 액션 정보가 **있다**(팀 액션 상세엔 이게 없다 — 팀 액션이 최상위라서).
 */
export interface PersonalActionDetail {
  /** BE 자동증가 정수 PK. */
  id: number;
  name: string;
  description: string;
  team: string;
  projectId: number;
  projectTag: string;
  assigneeName: string;
  /** 본인 역할 — "프론트엔드"·"백엔드" 등. Leader면 "팀장". */
  assigneeRoleLabel: string;
  /** 이 개인 액션이 나온 팀 액션 회의. ⚠️ 회의 상세(`/app/meeting/:id`) 라우트가 아직 없어 링크는 없다. */
  sourceMeeting: {
    title: string;
    /** ISO datetime */
    scheduledAt: string;
  };
  /** 상위 팀 액션 — 클릭 시 `/app/projects/:projectId/team/:teamActionId`로 이동. */
  parentTeamAction: {
    id: number;
    name: string;
    team: string;
    /** 마감일 `YYYY-MM-DD` */
    dueDate: string;
  };
}
