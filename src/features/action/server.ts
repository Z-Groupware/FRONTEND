import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { TEAM_ACTION_PERSONAL_ITEMS_MOCK } from "@/features/project/mock/team-action-detail";
import { isMock } from "@/mocks/config";

import { PERSONAL_ACTION_DETAIL_MOCK } from "./mock/action-detail";
import type { MyActionListItem, PersonalActionDetail } from "./types";

/** 개인 액션 상세(`/app/actions/:actionId`). 못 찾으면 `null`(호출부가 404). */
export async function getPersonalActionDetail(
  actionId: string,
): Promise<PersonalActionDetail | null> {
  if (isMock) {
    const numericId = Number(actionId);
    if (!Number.isInteger(numericId)) return null;
    return PERSONAL_ACTION_DETAIL_MOCK[numericId] ?? null;
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}

/** 내 액션 목록(`/app/my/actions`) — 담당자 이름이 일치하는 개인 액션 전체, 마감 임박순. */
export async function getMyActionList(assigneeName: string): Promise<MyActionListItem[]> {
  if (isMock) {
    const list: MyActionListItem[] = [];
    for (const items of Object.values(TEAM_ACTION_PERSONAL_ITEMS_MOCK)) {
      for (const item of items) {
        if (item.assigneeName !== assigneeName) continue;
        const detail = PERSONAL_ACTION_DETAIL_MOCK[item.id];
        if (!detail) continue;
        const project = TOP_LEVEL_PROJECTS.find((p) => p.id === detail.projectId);
        if (!project) continue;
        list.push({
          id: item.id,
          title: item.title,
          description: detail.description,
          team: detail.team,
          projectId: detail.projectId,
          projectName: project.name,
          projectTag: detail.projectTag,
          startDate: item.startDate,
          dueDate: item.dueDate,
          status: item.status,
        });
      }
    }
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}
