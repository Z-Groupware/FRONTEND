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
  /*
    ⚠️ 아래 넷은 **보드 세 칸을 다 채우려고** 넣었다(2026-08-11). 셋 다 진행중이라 보드의
       `할일`·`완료` 칸이 늘 비어 있었는데, 빈 칸만 보면 드래그 규칙(§canMoveCard)도
       지연 배지도 화면에서 확인할 수가 없다(§정직한 목업).
    ⚠️ 칸은 **저장값이 아니라 날짜로 계산된다**(`getBoardColumn`) — `할일`은 시작일이 아직
       안 온 것, `완료`는 `status`가 DONE인 것이다. 그래서 시작일을 미래로 둔다.
  */
  {
    id: 4,
    name: "고객센터 챗봇 도입",
    description:
      "반복 문의를 줄이기 위해 고객센터에 챗봇을 도입한다. 시나리오 설계와 상담 이관 흐름을 개발·전략기획팀이 맡는다.",
    tag: "SUPPORT",
    departments: ["개발팀", "전략기획팀"],
    actionTotal: 6,
    actionDone: 0,
    startDate: "2026-09-01",
    dueDate: "2026-10-24",
    status: PROJECT_STATUS.TODO,
  },
  {
    id: 5,
    name: "4분기 채용 브랜딩",
    description:
      "4분기 공개 채용에 맞춰 채용 페이지와 홍보 자산을 새로 만든다. 마케팅·디자인팀이 함께 진행한다.",
    tag: "HIRING",
    departments: ["마케팅팀", "디자인팀"],
    actionTotal: 5,
    actionDone: 0,
    startDate: "2026-08-24",
    dueDate: "2026-10-10",
    status: PROJECT_STATUS.TODO,
  },
  {
    id: 6,
    name: "상반기 결산 리포트",
    description:
      "상반기 실적을 정리해 사내 공유용 리포트를 만든다. 전략기획팀이 주관하고 각 팀이 수치를 제출한다.",
    tag: "REPORT",
    departments: ["전략기획팀"],
    actionTotal: 7,
    actionDone: 7,
    startDate: "2026-06-01",
    dueDate: "2026-07-10",
    status: PROJECT_STATUS.DONE,
  },
  {
    id: 7,
    name: "사내 보안 점검",
    description:
      "분기 보안 점검을 수행하고 발견된 취약점을 정리한다. 개발팀이 점검하고 전략기획팀이 결과를 보고한다.",
    tag: "SECURITY",
    departments: ["개발팀", "전략기획팀"],
    actionTotal: 4,
    actionDone: 4,
    startDate: "2026-06-15",
    dueDate: "2026-07-31",
    status: PROJECT_STATUS.DONE,
  },
  /*
    ⚠️ **마감이 지난 진행중**을 하나 둔다. 지연은 저장 상태가 아니라 마감일로 계산해
       배지로만 뜨는데(§도메인 상수), 그 배지가 실제로 뜨는 데이터가 없었다.
  */
  {
    id: 8,
    name: "결제 모듈 고도화",
    description:
      "간편결제 수단을 늘리고 실패 재시도 흐름을 정비한다. 개발팀이 담당하며 굿즈 앱과 함께 배포한다.",
    tag: "GOODS",
    departments: ["개발팀"],
    actionTotal: 3,
    actionDone: 1,
    startDate: "2026-07-01",
    dueDate: "2026-08-07",
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
