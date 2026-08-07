import { ACTION_STATUS, AUTHORITY, type Authority, PROJECT_STATUS } from "@/constants/domain";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import {
  TEAM_ACTION_DETAIL_MOCK,
  TEAM_ACTION_PERSONAL_ITEMS_MOCK,
} from "@/features/project/mock/team-action-detail";
import { pickPaletteColor } from "@/lib/palette";
import { isMock } from "@/mocks/config";

import type { BoardCard, BoardType } from "./types";

/** 오너 보드 — 전체 프로젝트. */
export async function getProjectBoard(): Promise<BoardCard[]> {
  if (isMock) {
    return TOP_LEVEL_PROJECTS.map((project) => {
      const tagColor = pickPaletteColor(project.tag);
      return {
        id: project.id,
        title: project.name,
        tagLabel: project.tag,
        tagBgColor: tagColor.bgColor,
        tagTextColor: tagColor.textColor,
        startDate: project.startDate,
        dueDate: project.dueDate,
        isDone: project.status === PROJECT_STATUS.DONE,
        href: `/app/projects/${project.id}`,
      };
    });
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}

/**
 * 팀장·사원 보드 — 담당자 이름이 일치하는 개인 액션 전체.
 * ⚠️ 팀 액션은 여기 안 나온다(§상태 정책) — 팀 액션 완료 여부는 하위 개인 액션 집계로
 *    파생되지, 사람이 보드에서 직접 옮기는 대상이 아니다.
 */
export async function getMyActionBoard(assigneeName: string): Promise<BoardCard[]> {
  if (isMock) {
    const cards: BoardCard[] = [];
    for (const [teamActionIdText, items] of Object.entries(TEAM_ACTION_PERSONAL_ITEMS_MOCK)) {
      const teamAction = TEAM_ACTION_DETAIL_MOCK[Number(teamActionIdText)];
      if (!teamAction) continue;
      const tagColor = pickPaletteColor(teamAction.projectTag);
      for (const item of items) {
        if (item.assigneeName !== assigneeName) continue;
        cards.push({
          id: item.id,
          title: item.title,
          tagLabel: teamAction.projectTag,
          tagBgColor: tagColor.bgColor,
          tagTextColor: tagColor.textColor,
          startDate: item.startDate,
          dueDate: item.dueDate,
          isDone: item.status === ACTION_STATUS.DONE,
          href: `/app/actions/${item.id}`,
        });
      }
    }
    return cards;
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}

/**
 * ⚠️ 임시 — 권한별 미리보기 전환용(2026-08-06, 실제 로그인 붙기 전 QA 확인용). 실연동 시 이 함수와
 * 호출부(보드 화면의 권한 토글)를 통째로 지운다. Leader·Member는 대시보드 목에서 이미 쓰는
 * 대표 인물(김서준·이하윤)의 액션으로 미리 채운다 — 실제로는 로그인한 그 사람의 액션이 나온다.
 */
export async function loadBoardForRole(
  role: Authority,
): Promise<{ boardType: BoardType; cards: BoardCard[] }> {
  if (role === AUTHORITY.OWNER) {
    return { boardType: "project", cards: await getProjectBoard() };
  }
  const previewAssigneeName = role === AUTHORITY.LEADER ? "김서준" : "이하윤";
  return { boardType: "my-action", cards: await getMyActionBoard(previewAssigneeName) };
}
