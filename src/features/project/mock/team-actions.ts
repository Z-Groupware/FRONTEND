import { ACTION_STATUS } from "@/constants/domain";

import type { ProjectTeamAction } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전(ERD·API 스펙 미확정). 프로젝트 상세(`/app/projects/:projectId`)의
 * 타임라인 탭에 쓴다. 프로젝트 태그별로 참여 팀들이 받은 팀 액션 목록이다.
 * ⚠️ 오늘(2026-08-06) 기준 — **할일(TODO) 상태는 시작일이 오늘보다 뒤여야 한다**(오늘선을
 *    가로지르면 안 됨, `member/mock/dashboard.ts`와 같은 규칙). 진행중은 오늘을 가로질러도 된다.
 */
export const PROJECT_TEAM_ACTIONS_MOCK: Record<string, ProjectTeamAction[]> = {
  GOODS: [
    {
      id: "ta-goods-1",
      name: "앱 개발 착수",
      team: "개발팀",
      startDate: "2026-07-21",
      dueDate: "2026-08-29",
      status: ACTION_STATUS.IN_PROGRESS,
    },
    {
      id: "ta-goods-2",
      name: "결제 시스템 연동",
      team: "개발팀",
      startDate: "2026-08-11",
      dueDate: "2026-09-12",
      status: ACTION_STATUS.TODO,
    },
    {
      id: "ta-goods-3",
      name: "TV 광고 계약 및 모델 섭외",
      team: "마케팅팀",
      startDate: "2026-08-11",
      dueDate: "2026-08-22",
      status: ACTION_STATUS.TODO,
    },
    {
      id: "ta-goods-4",
      name: "굿즈 디자인 시안 제작",
      team: "디자인팀",
      startDate: "2026-07-21",
      dueDate: "2026-08-22",
      status: ACTION_STATUS.IN_PROGRESS,
    },
  ],
  BRAND: [
    {
      id: "ta-brand-1",
      name: "로고·가이드라인 개편",
      team: "디자인팀",
      startDate: "2026-08-01",
      dueDate: "2026-08-20",
      status: ACTION_STATUS.IN_PROGRESS,
    },
    {
      id: "ta-brand-2",
      name: "캠페인 자산 제작",
      team: "마케팅팀",
      startDate: "2026-08-15",
      dueDate: "2026-09-12",
      status: ACTION_STATUS.TODO,
    },
  ],
  COLLAB: [
    {
      id: "ta-collab-1",
      name: "협업툴 리뉴얼 착수",
      team: "개발팀",
      startDate: "2026-07-25",
      dueDate: "2026-08-25",
      status: ACTION_STATUS.IN_PROGRESS,
    },
    {
      id: "ta-collab-2",
      name: "회의·문서·일정 흐름 통합 설계",
      team: "전략기획팀",
      startDate: "2026-08-10",
      dueDate: "2026-09-19",
      status: ACTION_STATUS.TODO,
    },
  ],
};

/** ⚠️ 목 데이터 — 프로젝트 기획서 등 첨부파일명. 실제 업로드·다운로드는 API 스펙 확정 후. */
export const PROJECT_ATTACHMENT_MOCK: Record<string, string> = {
  GOODS: "기획서.pdf",
  BRAND: "리뉴얼_가이드라인.pdf",
  COLLAB: "협업툴_요구사항.pdf",
};
