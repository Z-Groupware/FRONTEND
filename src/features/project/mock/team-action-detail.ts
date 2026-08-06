import { ACTION_STATUS } from "@/constants/domain";

import type { TeamActionDetail, TeamActionPersonalItem } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전(ERD·API 스펙 미확정). 팀 액션 상세
 * (`/app/projects/:projectId/team/:teamActionId`)의 상세 탭에 쓴다.
 * `PROJECT_TEAM_ACTIONS_MOCK`의 id와 1:1로 대응한다.
 */
export const TEAM_ACTION_DETAIL_MOCK: Record<string, TeamActionDetail> = {
  "ta-goods-1": {
    id: "ta-goods-1",
    name: "앱 개발 착수",
    description:
      "연예인 굿즈 쇼핑몰 앱의 개발을 시작한다. 온보딩·인증·상품 목록 등 초기 화면 흐름을 붙이고, " +
      "결제·재고 연동은 다음 팀 액션에서 이어간다.",
    team: "개발팀",
    projectId: 1,
    projectTag: "GOODS",
    assigneeName: "김서준",
    assigneeRoleLabel: "팀장",
    sourceMeeting: { title: "GOODS 프로젝트 기획 회의", scheduledAt: "2026-07-20T14:00" },
  },
  "ta-goods-2": {
    id: "ta-goods-2",
    name: "결제 시스템 연동",
    description: "카드·간편결제 PG사를 붙이고, 주문·환불 흐름을 결제 상태와 맞춰 구현한다.",
    team: "개발팀",
    projectId: 1,
    projectTag: "GOODS",
    assigneeName: "김서준",
    assigneeRoleLabel: "팀장",
    sourceMeeting: { title: "GOODS 프로젝트 기획 회의", scheduledAt: "2026-07-20T14:00" },
  },
  "ta-goods-3": {
    id: "ta-goods-3",
    name: "TV 광고 계약 및 모델 섭외",
    description: "런칭 시점에 맞춰 방영할 TV 광고를 기획하고, 광고 모델 섭외·계약을 진행한다.",
    team: "마케팅팀",
    projectId: 1,
    projectTag: "GOODS",
    assigneeName: "최유진",
    assigneeRoleLabel: "팀장",
    sourceMeeting: { title: "GOODS 프로젝트 기획 회의", scheduledAt: "2026-07-20T14:00" },
  },
  "ta-goods-4": {
    id: "ta-goods-4",
    name: "굿즈 디자인 시안 제작",
    description: "1차 출시 굿즈 라인업의 디자인 시안을 제작하고, 아티스트 소속사 컨펌을 받는다.",
    team: "디자인팀",
    projectId: 1,
    projectTag: "GOODS",
    assigneeName: "강서연",
    assigneeRoleLabel: "팀장",
    sourceMeeting: { title: "GOODS 프로젝트 기획 회의", scheduledAt: "2026-07-20T14:00" },
  },
  "ta-brand-1": {
    id: "ta-brand-1",
    name: "로고·가이드라인 개편",
    description: "브랜드 로고와 컬러·타이포 가이드라인을 새로 정리하고, 적용 예시 세트를 만든다.",
    team: "디자인팀",
    projectId: 2,
    projectTag: "BRAND",
    assigneeName: "강서연",
    assigneeRoleLabel: "팀장",
    sourceMeeting: { title: "BRAND 프로젝트 기획 회의", scheduledAt: "2026-07-31T11:00" },
  },
  "ta-brand-2": {
    id: "ta-brand-2",
    name: "캠페인 자산 제작",
    description: "새 가이드라인을 반영한 SNS·배너 등 캠페인 자산을 제작한다.",
    team: "마케팅팀",
    projectId: 2,
    projectTag: "BRAND",
    assigneeName: "최유진",
    assigneeRoleLabel: "팀장",
    sourceMeeting: { title: "BRAND 프로젝트 기획 회의", scheduledAt: "2026-07-31T11:00" },
  },
  "ta-collab-1": {
    id: "ta-collab-1",
    name: "협업툴 리뉴얼 착수",
    description: "사내 협업툴의 회의·문서·일정 화면을 재정비하기 위한 초기 개발을 시작한다.",
    team: "개발팀",
    projectId: 3,
    projectTag: "COLLAB",
    assigneeName: "김서준",
    assigneeRoleLabel: "팀장",
    sourceMeeting: { title: "COLLAB 프로젝트 기획 회의", scheduledAt: "2026-07-24T15:00" },
  },
  "ta-collab-2": {
    id: "ta-collab-2",
    name: "회의·문서·일정 흐름 통합 설계",
    description: "따로 흩어진 회의·문서·일정 기능을 하나의 흐름으로 잇는 정보 구조를 설계한다.",
    team: "전략기획팀",
    projectId: 3,
    projectTag: "COLLAB",
    assigneeName: "오현우",
    assigneeRoleLabel: "팀장",
    sourceMeeting: { title: "COLLAB 프로젝트 기획 회의", scheduledAt: "2026-07-24T15:00" },
  },
};

/**
 * ⚠️ 목 데이터 — BE 연동 전. 팀 액션 상세의 타임라인 탭 — 이 팀 액션에 속한 개인 액션들.
 * 담당자별 한 행(§WORKFLOW.md 4절). `ta-goods-1`만 실제 인원(개발팀)으로 채우고,
 * 나머지는 해당 팀 팀장 명의로 대표 항목 하나씩만 둔다(개인 액션 화면은 이후 별도 이슈).
 */
export const TEAM_ACTION_PERSONAL_ITEMS_MOCK: Record<string, TeamActionPersonalItem[]> = {
  "ta-goods-1": [
    {
      id: "pa-goods-1-1",
      title: "온보딩 플로우 와이어프레임 검토",
      assigneeName: "이하윤",
      assigneeRoleLabel: "프론트엔드",
      startDate: "2026-07-21",
      dueDate: "2026-08-14",
      status: ACTION_STATUS.IN_PROGRESS,
    },
    {
      id: "pa-goods-1-2",
      title: "인증 API 구현",
      assigneeName: "박도현",
      assigneeRoleLabel: "백엔드",
      startDate: "2026-08-11",
      dueDate: "2026-08-20",
      status: ACTION_STATUS.TODO,
    },
    {
      id: "pa-goods-1-3",
      title: "개발 환경 및 화면 흐름 리뷰",
      assigneeName: "김서준",
      assigneeRoleLabel: "팀장",
      startDate: "2026-08-11",
      dueDate: "2026-08-22",
      status: ACTION_STATUS.TODO,
    },
  ],
  "ta-goods-2": [
    {
      id: "pa-goods-2-1",
      title: "PG사 연동 검토",
      assigneeName: "박도현",
      assigneeRoleLabel: "백엔드",
      startDate: "2026-08-11",
      dueDate: "2026-08-25",
      status: ACTION_STATUS.TODO,
    },
  ],
  "ta-goods-3": [
    {
      id: "pa-goods-3-1",
      title: "광고 모델 후보 리스트업",
      assigneeName: "최유진",
      assigneeRoleLabel: "팀장",
      startDate: "2026-08-11",
      dueDate: "2026-08-18",
      status: ACTION_STATUS.TODO,
    },
  ],
  "ta-goods-4": [
    {
      id: "pa-goods-4-1",
      title: "1차 시안 제작",
      assigneeName: "강서연",
      assigneeRoleLabel: "팀장",
      startDate: "2026-07-21",
      dueDate: "2026-08-10",
      status: ACTION_STATUS.IN_PROGRESS,
    },
  ],
  "ta-brand-1": [
    {
      id: "pa-brand-1-1",
      title: "가이드라인 초안 정리",
      assigneeName: "강서연",
      assigneeRoleLabel: "팀장",
      startDate: "2026-08-01",
      dueDate: "2026-08-14",
      status: ACTION_STATUS.IN_PROGRESS,
    },
  ],
  "ta-brand-2": [
    {
      id: "pa-brand-2-1",
      title: "SNS 캠페인 배너 제작",
      assigneeName: "최유진",
      assigneeRoleLabel: "팀장",
      startDate: "2026-08-15",
      dueDate: "2026-08-29",
      status: ACTION_STATUS.TODO,
    },
  ],
  "ta-collab-1": [
    {
      id: "pa-collab-1-1",
      title: "회의 도메인 스캐폴딩",
      assigneeName: "김서준",
      assigneeRoleLabel: "팀장",
      startDate: "2026-07-25",
      dueDate: "2026-08-08",
      status: ACTION_STATUS.IN_PROGRESS,
    },
  ],
  "ta-collab-2": [
    {
      id: "pa-collab-2-1",
      title: "정보 구조 초안 설계",
      assigneeName: "오현우",
      assigneeRoleLabel: "팀장",
      startDate: "2026-08-10",
      dueDate: "2026-08-25",
      status: ACTION_STATUS.TODO,
    },
  ],
};
