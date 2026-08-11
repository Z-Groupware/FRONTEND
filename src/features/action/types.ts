import type { ActionStatus } from "@/constants/domain";

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
  /** 본인 역할 — "프론트엔드"·"백엔드" 등. Leader면 "팀장". 역할 미지정이면 없음. */
  assigneeRoleLabel?: string;
  /**
   * 이 개인 액션이 나온 회의 — **수동으로 추가한 액션(`POST /api/actions` 예외 경로)엔 없다**
   * (2026-08-11, 실 API 대조 확인). 클릭 시 `/app/meeting/:id`로 이동(2026-08-11, 회의 상세
   * 라우트가 생겨 링크 추가).
   */
  sourceMeeting?: {
    id: number;
    title: string;
    /** ISO datetime */
    scheduledAt: string;
  };
  /**
   * 상위 팀 액션 — **수동으로 추가한 액션엔 없다**(같은 이유, 2026-08-11 확인).
   * 클릭 시 `/app/projects/:projectId/team/:teamActionId`로 이동.
   */
  parentTeamAction?: {
    id: number;
    name: string;
    team: string;
    /** 마감일 `YYYY-MM-DD` */
    dueDate: string;
  };
}

/**
 * 내 액션(`/app/my/actions`) 목록 한 줄 — 리스트 전용이라 상세 화면의 회의·상위 팀 액션
 * 정보는 없다. 제목·태그·팀명·상태·마감일·세부 설명 한 줄만 있으면 된다.
 */
export interface MyActionListItem {
  id: number;
  title: string;
  description: string;
  team: string;
  projectId: number;
  projectName: string;
  projectTag: string;
  /** 작업 시작일 `YYYY-MM-DD` — 지연 판정에는 안 쓰지만(`isDelayed`는 마감일만 본다) 계약은 갖춰 둔다. */
  startDate: string;
  /** 마감일 `YYYY-MM-DD` */
  dueDate: string;
  status: ActionStatus;
}

/** 팀 액션 관리(`/team/action`) 타임라인의 팀 액션 한 줄. */
export interface TeamActionTimelineItem {
  id: number;
  name: string;
  /** 작업 시작일 `YYYY-MM-DD` — 타임라인 막대 왼쪽 끝 */
  startDate: string;
  /** 마감일 `YYYY-MM-DD` */
  dueDate: string;
  status: ActionStatus;
}

/**
 * 팀 액션 관리 화면 — 프로젝트별로 묶은 팀 액션 그룹.
 * ⚠️ 하위 개인 액션 진척률(게이지)은 이 목록 API(`GET /api/team/actions`)에 값이 없어 아직 없다
 *    — BE에 `childDoneCount`·`childTotalCount` 추가 요청해 둠(2026-08-11). 나오면 게이지만 얹는다.
 */
export interface TeamActionProjectGroup {
  projectId: number;
  projectName: string;
  projectTag: string;
  teamActions: TeamActionTimelineItem[];
}
