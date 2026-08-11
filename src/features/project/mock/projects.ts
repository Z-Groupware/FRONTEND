import { PROJECT_STATUS } from "@/constants/domain";

import type { ProjectDraft, ProjectListItem } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전(ERD·API 스펙 미확정, DECISIONS.md).
 * 워크플로우 문서의 대표 프로젝트 3개(GOODS·BRAND·COLLAB) 기준. 전부 Owner(박대표)가 개설했고
 * 현재 진행중이라 진척율은 착수 직후(0%)다. 마감 임박순 정렬은 서버가 얹는다.
 */
export const TOP_LEVEL_PROJECTS: ProjectListItem[] = [
  {
    id: 1,
    name: "연예인 굿즈 쇼핑몰 앱 구축",
    description:
      "아티스트 공식 굿즈를 판매하는 모바일 커머스 앱을 신규 구축한다. 회원가입·결제·상품 관리 전반을 포함하며 개발·마케팅·디자인 3개 팀이 참여한다.",
    tag: "GOODS",
    departments: ["개발팀", "마케팅팀", "디자인팀"],
    actionTotal: 11,
    actionDone: 0,
    startDate: "2026-07-15",
    dueDate: "2026-09-05",
    status: PROJECT_STATUS.IN_PROGRESS,
  },
  {
    id: 2,
    name: "3분기 마케팅 브랜드 리뉴얼",
    description:
      "3분기 브랜드 아이덴티티를 리뉴얼한다. 로고·가이드라인 개편과 캠페인 자산 제작을 마케팅·디자인팀이 함께 진행한다.",
    tag: "BRAND",
    departments: ["마케팅팀", "디자인팀"],
    actionTotal: 4,
    actionDone: 0,
    startDate: "2026-07-20",
    dueDate: "2026-09-12",
    status: PROJECT_STATUS.IN_PROGRESS,
  },
  {
    id: 3,
    name: "사내 협업툴 리뉴얼",
    description:
      "사내에서 쓰는 협업 도구를 재정비한다. 회의·문서·일정 흐름을 하나로 잇는 개편을 개발·전략기획팀이 담당한다.",
    tag: "COLLAB",
    departments: ["개발팀", "전략기획팀"],
    actionTotal: 4,
    actionDone: 0,
    startDate: "2026-07-10",
    dueDate: "2026-09-19",
    status: PROJECT_STATUS.IN_PROGRESS,
  },
];

/** BE는 자동증가 정수 PK를 준다 — 목도 같은 모양으로 다음 id를 이어 붙인다. */
let nextProjectId = TOP_LEVEL_PROJECTS.length + 1;

/**
 * 프로젝트 생성 — 격리막(CLAUDE.md §Mock 격리막). 새 프로젝트는 착수 직후라 진척 0%·할일 상태로 만든다.
 * ⚠️ 태그 색상(`tagColor`)은 지금 이 목 배열에 저장할 자리가 없다 — `ProjectListItem`엔
 *    색 필드가 없고 목록은 태그명을 해시해 색을 뽑는다(`pickPaletteColor`). 사용자가 고른 색은
 *    BE에 색 필드가 생기면 그때 같이 흘려보낸다(지금은 생성 폼에서만 쓰고 버려진다).
 */
export function addMockProject(draft: ProjectDraft): ProjectListItem {
  const project: ProjectListItem = {
    id: nextProjectId++,
    name: draft.name,
    description: draft.description,
    tag: draft.tag,
    departments: draft.teamNames,
    actionTotal: 0,
    actionDone: 0,
    startDate: draft.startDate,
    dueDate: draft.dueDate,
    status: PROJECT_STATUS.TODO,
  };
  TOP_LEVEL_PROJECTS.push(project);
  return project;
}
