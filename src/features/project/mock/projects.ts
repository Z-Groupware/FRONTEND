import { PROJECT_STATUS } from "@/constants/domain";

import type { ProjectListItem } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전(ERD·API 스펙 미확정, DECISIONS.md).
 * 워크플로우 문서의 대표 프로젝트 3개(GOODS·BRAND·COLLAB) 기준. 전부 Owner(박대표)가 개설했고
 * 현재 진행중이라 진척율은 착수 직후(0%)다. 마감 임박순 정렬은 서버가 얹는다.
 */
export const TOP_LEVEL_PROJECTS: ProjectListItem[] = [
  {
    id: "p-goods",
    name: "연예인 굿즈 쇼핑몰 앱 구축",
    tag: "GOODS",
    color: "#7C3AED",
    departments: ["개발팀", "마케팅팀", "디자인팀"],
    actionTotal: 11,
    actionDone: 0,
    dueDate: "2026-09-05",
    status: PROJECT_STATUS.IN_PROGRESS,
  },
  {
    id: "p-brand",
    name: "3분기 마케팅 브랜드 리뉴얼",
    tag: "BRAND",
    color: "#DB2777",
    departments: ["마케팅팀", "디자인팀"],
    actionTotal: 4,
    actionDone: 0,
    dueDate: "2026-09-12",
    status: PROJECT_STATUS.IN_PROGRESS,
  },
  {
    id: "p-collab",
    name: "사내 협업툴 리뉴얼",
    tag: "COLLAB",
    color: "#2563EB",
    departments: ["개발팀", "전략기획팀"],
    actionTotal: 4,
    actionDone: 0,
    dueDate: "2026-09-19",
    status: PROJECT_STATUS.IN_PROGRESS,
  },
];
