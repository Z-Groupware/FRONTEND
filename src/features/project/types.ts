import type { ActionStatus, ProjectStatus } from "@/constants/domain";
import type { TagColorName } from "@/lib/palette";

/**
 * 프로젝트 전체 조회(`/app/projects`)의 한 행. UI 계약(Mock → Live 격리막) — 컴포넌트는 이 타입만 안다.
 * ⚠️ 프로젝트는 전부 Owner가 개설하므로 개설자 라벨은 항상 "Owner"라 필드로 두지 않는다(상수 표시).
 */
export interface ProjectListItem {
  /** BE 자동증가 정수 PK. URL(`/app/projects/:projectId`)에는 이 값이 그대로 실린다(태그 아님). */
  id: number;
  name: string;
  /**
   * 세부 설명(기획). 실제로는 Owner가 길게 쓸 수 있는 본문이라 목록에선 **첫 줄만** 잘라 보여준다.
   * ⚠️ 목록 카드에는 요약이 아니라 원문을 그대로 내려보내고, 자르기는 화면이 `line-clamp`로 한다.
   */
  description: string;
  /**
   * 프로젝트 태그(프로젝트당 1개 고정). 태그 칩·스트립 색은 이 값으로 고정 팔레트에서 뽑는다
   * (`lib/palette` → `globals.css --tag-*`). 별도 색 필드를 두지 않는다 — 자유 HEX는 다크모드에
   * 안 맞고, BE에 색 필드가 없어 프론트가 이름으로 일관되게 배정한다.
   */
  tag: string;
  /** 참여 부서명들 — 2개까지 노출 후 `+N` */
  departments: string[];
  /** 이 태그가 달린 전체 액션 수 */
  actionTotal: number;
  /** 그중 완료 액션 수 — 진척율 = done/total */
  actionDone: number;
  /** 마감일 `YYYY-MM-DD` */
  dueDate: string;
  status: ProjectStatus;
}

/**
 * 프로젝트 생성 폼 입력 — 화면과 서버 액션이 **같은 스키마**로 검증한다(규칙이 두 벌이면 어긋난다).
 * ⚠️ `attachmentName`은 목 단계라 파일명만 들고 있는다 — 실제 업로드는 API 스펙 확정 후.
 */
export interface ProjectDraft {
  name: string;
  tag: string;
  description: string;
  tagColor: TagColorName;
  dueDate: string;
  /** 참여 팀 — 최소 1개. 순서 무관, 빈 값은 제출 전 걸러낸다. */
  teamNames: string[];
  attachmentName?: string;
}

/** 칸별 검증 오류 — 비어 있으면 통과. `teamNames`는 배열이라 한 문구로 받는다. */
export type ProjectFormErrors = Partial<
  Record<keyof Omit<ProjectDraft, "teamNames" | "attachmentName">, string> & {
    teamNames: string;
  }
>;

/**
 * 프로젝트 상세(`/app/projects/:projectId`)의 기획 탭. `ProjectListItem`과 필드가 겹치지만
 * 목록에 없는 첨부파일이 있어 별도 타입으로 둔다 — 목록 카드에 첨부파일까지 끌고 오지 않는다.
 * ⚠️ URL은 `id`로 다닌다(태그를 그대로 노출하지 않는다, 2026-08-06 확정) — `tag`는 화면 표시용.
 */
export interface ProjectDetail {
  /** BE 자동증가 정수 PK — `ProjectListItem.id`와 같은 값. */
  id: number;
  tag: string;
  name: string;
  description: string;
  dueDate: string;
  /** 참여 팀 전체 — 목록과 달리 자르지 않는다(상세라 다 보여준다) */
  teamNames: string[];
  /** ⚠️ 목 단계라 파일명만 — 실제 다운로드는 API 스펙 확정 후 */
  attachmentName?: string;
}

/**
 * 프로젝트 상세의 타임라인 탭 한 줄 — 이 프로젝트에 속한 팀 액션 한 건.
 * ⚠️ 팀 액션 1개 = 이 프로젝트 타임라인의 막대 1개(WORKFLOW.md §1 타임라인 탭).
 */
export interface ProjectTeamAction {
  id: string;
  name: string;
  team: string;
  /** 작업 시작일 `YYYY-MM-DD` */
  startDate: string;
  /** 마감일 `YYYY-MM-DD` */
  dueDate: string;
  status: ActionStatus;
}
