import type { ProjectStatus } from "@/constants/domain";
import { isMock } from "@/mocks/config";

import { TOP_LEVEL_PROJECTS } from "./mock/projects";
import type { ProjectListItem } from "./types";

/**
 * 프로젝트 전체 조회 — 상태 탭으로 거르고 **마감 임박순(오름차순)** 정렬.
 * ⚠️ 실연동 시 이 분기와 매퍼만 고친다(격리막). 페이지네이션은 BE가 페이지 단위로 주면 그때 얹는다.
 */
export async function getProjectList(status: ProjectStatus): Promise<ProjectListItem[]> {
  if (isMock) {
    return TOP_LEVEL_PROJECTS.filter((project) => project.status === status).sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    );
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}
