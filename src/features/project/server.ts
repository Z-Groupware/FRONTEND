import type { ProjectStatus } from "@/constants/domain";
import { isMock } from "@/mocks/config";

import { DEFAULT_PROJECT_SORT, type ProjectSort, sortProjects } from "./lib";
import { TOP_LEVEL_PROJECTS } from "./mock/projects";
import type { ProjectListItem } from "./types";

/** 이름에 검색어가 들어가는지(대소문자·공백 무시). 검색어가 없으면 항상 통과. */
function matchesKeyword(project: ProjectListItem, keyword?: string): boolean {
  const q = keyword?.trim().toLowerCase();
  if (!q) return true;
  return project.name.toLowerCase().includes(q);
}

export interface ProjectListQuery {
  status: ProjectStatus;
  keyword?: string;
  sort?: ProjectSort;
}

/**
 * 프로젝트 전체 조회 — 상태 탭·검색어로 거르고 정렬(기본 마감 임박순).
 * ⚠️ 실연동 시 이 분기와 매퍼만 고친다(격리막). 페이지네이션은 BE가 페이지 단위로 주면 그때 얹는다.
 */
export async function getProjectList({
  status,
  keyword,
  sort = DEFAULT_PROJECT_SORT,
}: ProjectListQuery): Promise<ProjectListItem[]> {
  if (isMock) {
    const filtered = TOP_LEVEL_PROJECTS.filter(
      (project) => project.status === status && matchesKeyword(project, keyword),
    );
    return sortProjects(filtered, sort);
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}

/**
 * 상태별 프로젝트 수 — 필터 탭에 붙는 배지. 검색어가 있으면 그 결과 안에서 센다(탭·목록이 같은 기준).
 */
export async function getProjectStatusCounts(
  keyword?: string,
): Promise<Record<ProjectStatus, number>> {
  if (isMock) {
    const counts: Record<ProjectStatus, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const project of TOP_LEVEL_PROJECTS) {
      if (matchesKeyword(project, keyword)) counts[project.status] += 1;
    }
    return counts;
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}
