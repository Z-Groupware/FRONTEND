import { DEFAULT_PROJECT_SORT, type ProjectSort, type ProjectStatus } from "@/constants/domain";
import { COMPANY_TEAM_NAMES } from "@/constants/project";
import {
  type BeActionSummary,
  type BeTeamActionDetail,
  toTeamActionDetail,
  toTeamActionPersonalItem,
} from "@/features/action/mapper";
import { requireAccessToken } from "@/features/auth/session";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { sortProjects } from "./lib";
import type {
  BePageResponse,
  BeProjectDetail,
  BeProjectSummary,
  BeProjectTimelineItem,
} from "./mapper";
import { toProjectDetail, toProjectListItem, toProjectTeamAction } from "./mapper";
import { TOP_LEVEL_PROJECTS } from "./mock/projects";
import {
  TEAM_ACTION_DETAIL_MOCK,
  TEAM_ACTION_PERSONAL_ITEMS_MOCK,
} from "./mock/team-action-detail";
import { PROJECT_ATTACHMENT_MOCK, PROJECT_TEAM_ACTIONS_MOCK } from "./mock/team-actions";
import type {
  ProjectDetail,
  ProjectListItem,
  ProjectTeamAction,
  TeamActionDetail,
  TeamActionPersonalItem,
} from "./types";

/** [확인] `TeamController` 응답 — `teamId`·`name`만 쓴다(company/mapper.ts의 `BeTeam`과 같은 shape). */
interface BeTeamOption {
  teamId: number;
  name: string;
}

/**
 * 회사 팀 목록 — 이름↔id 변환에 쓴다. 상세 응답(`teamIds`)을 이름으로 보여줄 때,
 * 생성 폼이 고른 이름을 id로 되돌릴 때 둘 다 여기서 가져온 값을 쓴다.
 * ⚠️ **이름 중복이 없다는 전제.** 같은 이름의 팀이 둘 생기면 이 매핑이 먼저 잡힌 쪽으로 뭉갠다 —
 *    지금 팀 이름 정책상 중복을 안 만들지만, 생기면 여기부터 깨진다.
 */
async function getTeamOptions(accessToken: string): Promise<BeTeamOption[]> {
  return serverApi<BeTeamOption[]>(ep.teams(), { accessToken });
}

/** 목록 API가 페이지네이션이 생겼지만, 이 화면은 아직 전체를 한 번에 받아 클라에서 거른다
 *  (§목록·페이지네이션 무한스크롤은 별도 작업 — 지금은 기존 화면 동작과 동등하게만 맞춘다).
 *  `size`를 크게 잡으면 사실상 전체가 온다(문서 안내 그대로). */
async function fetchAllProjects(accessToken: string): Promise<BeProjectSummary[]> {
  const page = await serverApi<BePageResponse<BeProjectSummary>>(ep.projects({ size: 9999 }), {
    accessToken,
  });
  return page.content;
}

/** 이름에 검색어가 들어가는지(대소문자·공백 무시). 검색어가 없으면 항상 통과. */
function matchesKeyword(project: ProjectListItem, keyword?: string): boolean {
  const q = keyword?.trim().toLowerCase();
  if (!q) return true;
  return project.name.toLowerCase().includes(q);
}

/** URL 세그먼트(문자열)로 온 id를 정수로 바꿔 찾는다 — 숫자가 아니면 못 찾은 것과 같다. */
function findProjectById(id: string): ProjectListItem | undefined {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return undefined;
  return TOP_LEVEL_PROJECTS.find((p) => p.id === numericId);
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

  const accessToken = await requireAccessToken();
  const all = (await fetchAllProjects(accessToken)).map(toProjectListItem);
  const filtered = all.filter(
    (project) => project.status === status && matchesKeyword(project, keyword),
  );
  return sortProjects(filtered, sort);
}

/**
 * 프로젝트 상세(`/app/projects/:projectId`)의 기획 탭 — 목록(`ProjectListItem`)에서 파생한다.
 * 이름·설명·마감일·참여 팀은 목록과 같은 소스라 여기서 새로 안 만든다. 못 찾으면 `null`(호출부가 404).
 * ⚠️ **id로 찾는다, 태그가 아니다** — URL에 태그를 그대로 노출하지 않는다(2026-08-06 확정).
 */
export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  if (isMock) {
    const project = findProjectById(id);
    if (!project) return null;
    const attachmentName = PROJECT_ATTACHMENT_MOCK[project.tag];
    return {
      id: project.id,
      tag: project.tag,
      name: project.name,
      description: project.description,
      dueDate: project.dueDate,
      teamNames: project.departments,
      attachments: attachmentName ? [{ id: 1, fileName: attachmentName, fileSize: 0 }] : [],
    };
  }

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;

  const accessToken = await requireAccessToken();
  let detail: BeProjectDetail;
  try {
    detail = await serverApi<BeProjectDetail>(ep.project(numericId), { accessToken });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }

  // ⚠️ 상세 응답엔 teamIds만 온다 — 이름으로 보여주려고 팀 목록을 한 번 더 불러 매핑한다.
  const teamOptions = await getTeamOptions(accessToken);
  const nameById = new Map(teamOptions.map((team) => [team.teamId, team.name]));
  const teamNames = detail.teamIds.map((teamId) => nameById.get(teamId) ?? `팀 #${teamId}`);

  return toProjectDetail(detail, teamNames);
}

/** 프로젝트 상세의 타임라인 탭 — 이 프로젝트에 속한 팀 액션 전체(여러 팀이 하나의 축에 함께). */
export async function getProjectTeamActions(id: string): Promise<ProjectTeamAction[]> {
  if (isMock) {
    const project = findProjectById(id);
    return project ? (PROJECT_TEAM_ACTIONS_MOCK[project.tag] ?? []) : [];
  }

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return [];

  const accessToken = await requireAccessToken();
  const items = await serverApi<BeProjectTimelineItem[]>(ep.projectTimeline(numericId), {
    accessToken,
  });
  return items.map(toProjectTeamAction);
}

/** 팀 액션 상세(`/app/projects/:projectId/team/:teamActionId`)의 상세 탭. 못 찾으면 `null`(호출부가 404). */
export async function getTeamActionDetail(teamActionId: string): Promise<TeamActionDetail | null> {
  if (isMock) {
    const numericId = Number(teamActionId);
    if (!Number.isInteger(numericId)) return null;
    return TEAM_ACTION_DETAIL_MOCK[numericId] ?? null;
  }

  const numericId = Number(teamActionId);
  if (!Number.isInteger(numericId)) return null;

  const accessToken = await requireAccessToken();
  try {
    const detail = await serverApi<BeTeamActionDetail>(ep.teamAction(numericId), { accessToken });
    return toTeamActionDetail(detail);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** 팀 액션 상세의 타임라인 탭 — 이 팀 액션에 속한 개인 액션 전체(담당자별 한 행). */
export async function getTeamActionPersonalItems(
  teamActionId: string,
): Promise<TeamActionPersonalItem[]> {
  if (isMock) {
    const numericId = Number(teamActionId);
    if (!Number.isInteger(numericId)) return [];
    return TEAM_ACTION_PERSONAL_ITEMS_MOCK[numericId] ?? [];
  }

  const numericId = Number(teamActionId);
  if (!Number.isInteger(numericId)) return [];

  // ⚠️ 이 함수는 실연동 준비만 끝난 상태다 — 유일한 호출부(팀 액션 상세 페이지)가
  //    `getTeamActionDetail`(아래, 필드 부족으로 여전히 미구현) 뒤에 있어서 지금은 화면에서
  //    닿지 않는다. 상세 필드가 채워지면 그 페이지를 여는 순간 바로 같이 동작한다.
  const accessToken = await requireAccessToken();
  const items = await serverApi<BeActionSummary[]>(ep.teamActionTimeline(numericId), {
    accessToken,
  });
  return items.map(toTeamActionPersonalItem);
}

/** 프로젝트 생성 폼의 "참여 팀" 선택지 — 회사 전체 팀 목록. */
export async function getCompanyTeamOptions(): Promise<string[]> {
  if (isMock) return [...COMPANY_TEAM_NAMES];

  const accessToken = await requireAccessToken();
  const teams = await getTeamOptions(accessToken);
  return teams.map((team) => team.name);
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

  const accessToken = await requireAccessToken();
  const all = (await fetchAllProjects(accessToken)).map(toProjectListItem);
  const counts: Record<ProjectStatus, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const project of all) {
    if (matchesKeyword(project, keyword)) counts[project.status] += 1;
  }
  return counts;
}

/**
 * 팀 이름 → id 변환 — 생성 폼이 이름으로 고른 값을 BE `teamIds`로 바꿀 때 쓴다.
 * ⚠️ 화면 밖에서 부르지 않는다(actions.ts 전용) — `getTeamOptions`는 server-only 모듈이라
 *    Server Action에서 직접 못 부르길래 이 파일이 대신 감싼다.
 */
export async function resolveTeamIds(accessToken: string, teamNames: string[]): Promise<number[]> {
  const teams = await getTeamOptions(accessToken);
  const idByName = new Map(teams.map((team) => [team.name, team.teamId]));
  return teamNames.map((name) => idByName.get(name)).filter((id): id is number => id !== undefined);
}
