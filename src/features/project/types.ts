import type { ProjectStatus } from "@/constants/domain";

/**
 * 프로젝트 전체 조회(`/app/projects`)의 한 행. UI 계약(Mock → Live 격리막) — 컴포넌트는 이 타입만 안다.
 * ⚠️ 프로젝트는 전부 Owner가 개설하므로 개설자 라벨은 항상 "Owner"라 필드로 두지 않는다(상수 표시).
 */
export interface ProjectListItem {
  id: string;
  name: string;
  /** 프로젝트 태그(프로젝트당 1개 고정) */
  tag: string;
  /** 자유 HEX(프로젝트 태그 색) */
  color: string;
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
