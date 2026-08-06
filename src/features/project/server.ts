import { DEFAULT_PROJECT_SORT, type ProjectSort, type ProjectStatus } from "@/constants/domain";
import { COMPANY_TEAM_NAMES } from "@/constants/project";
import { isMock } from "@/mocks/config";

import { sortProjects } from "./lib";
import { TOP_LEVEL_PROJECTS } from "./mock/projects";
import { PROJECT_ATTACHMENT_MOCK, PROJECT_TEAM_ACTIONS_MOCK } from "./mock/team-actions";
import type { ProjectDetail, ProjectListItem, ProjectTeamAction } from "./types";

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
 * 프로젝트 상세(`/app/projects/:tag`)의 기획 탭 — 목록(`ProjectListItem`)에서 파생한다.
 * 이름·설명·마감일·참여 팀은 목록과 같은 소스라 여기서 새로 안 만든다. 못 찾으면 `null`(호출부가 404).
 */
export async function getProjectDetail(tag: string): Promise<ProjectDetail | null> {
  if (isMock) {
    const project = TOP_LEVEL_PROJECTS.find((p) => p.tag === tag);
    if (!project) return null;
    return {
      tag: project.tag,
      name: project.name,
      description: project.description,
      dueDate: project.dueDate,
      teamNames: project.departments,
      attachmentName: PROJECT_ATTACHMENT_MOCK[tag],
    };
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}

/** 프로젝트 상세의 타임라인 탭 — 이 프로젝트에 속한 팀 액션 전체(여러 팀이 하나의 축에 함께). */
export async function getProjectTeamActions(tag: string): Promise<ProjectTeamAction[]> {
  if (isMock) return PROJECT_TEAM_ACTIONS_MOCK[tag] ?? [];

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}

/** 프로젝트 생성 폼의 "참여 팀" 선택지 — 회사 전체 팀 목록. */
export async function getCompanyTeamOptions(): Promise<string[]> {
  if (isMock) return [...COMPANY_TEAM_NAMES];

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
