import { requireAccessToken } from "@/features/auth/session";
import type { BePageResponse } from "@/features/project/mapper";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { TEAM_ACTION_PERSONAL_ITEMS_MOCK } from "@/features/project/mock/team-action-detail";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import {
  type BeActionDetail,
  type BeActionSummary,
  toMyActionListItem,
  toPersonalActionDetail,
} from "./mapper";
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

  const numericId = Number(actionId);
  if (!Number.isInteger(numericId)) return null;

  const accessToken = await requireAccessToken();
  try {
    const detail = await serverApi<BeActionDetail>(ep.action(numericId), { accessToken });
    return toPersonalActionDetail(detail);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * 내 액션 목록(`/app/my/actions`) — 담당자 이름이 일치하는 개인 액션 전체, 마감 임박순.
 * ⚠️ 실연동에선 `assigneeName`을 안 쓴다 — `GET /api/actions`가 이미 토큰의 본인 소유분만
 *    돌려준다(board/server.ts와 같은 이유). 파라미터는 mock 분기 전용으로 시그니처만 유지한다.
 */
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

  const accessToken = await requireAccessToken();
  const page = await serverApi<BePageResponse<BeActionSummary>>(ep.actions({ size: 9999 }), {
    accessToken,
  });
  return page.content
    .filter((action) => action.actionType === "PERSONAL")
    .map(toMyActionListItem)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
