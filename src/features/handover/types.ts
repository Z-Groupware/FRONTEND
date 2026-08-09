import type { ActionStatus, Authority } from "@/constants/domain";

/**
 * 인수인계서 신청 화면(`/app/handover`)의 **UI 계약**(CLAUDE.md §Mock 격리막).
 * WORKFLOW.md §7 인수인계서.
 */

/** 체크리스트 한 줄 — 완료 상태는 애초에 조회 단계에서 제외된다. */
export interface HandoverActionItem {
  id: number;
  projectTag: string;
  parentTeamActionName: string;
  title: string;
  status: ActionStatus;
  dueDate: string;
}

/** 신청자 — 화면이 role로 팀장 자가 재할당 분기를 튼다. */
export interface HandoverApplicant {
  id: string;
  name: string;
  role: Authority;
  teamName: string;
}

/** 팀장 본인 휴직 재할당 대상 — 본인 제외 팀원. */
export interface HandoverTeammateOption {
  id: string;
  name: string;
  position: string;
  role: string;
}

export interface HandoverContext {
  applicant: HandoverApplicant;
  actions: HandoverActionItem[];
  teammates: HandoverTeammateOption[];
}
