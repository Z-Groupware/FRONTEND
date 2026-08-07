/**
 * AI 액션 분배 리뷰 화면(`/app/meeting/:id/review`)의 **UI 계약**(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ 회의 종료 → AI 요약은 여기 오기 전 **초안**까지다. 실제 액션(팀/개인)은 이 화면에서
 *    [액션 분배 확정]을 눌러야 생긴다(CLAUDE.md §브라우저 API). 반려(✕)한 항목은 안 생긴다.
 */

import type { AiConfidence } from "@/constants/meeting";

/**
 * 담당자 드롭다운 선택지 — 화면엔 "이름 직급/팀"으로 합쳐 보여준다(스크린샷 기준).
 * ⚠️ **이 회의 참석자로만 한정한다.** 회사 전체 인원이 아니다 — 회의에 없던 사람에게
 *    액션이 갈 수는 없다. 연동 시 `Meeting.attendeeIds`(features/meeting/types.ts)로
 *    걸러서 채운다(지금은 mock이라 데모 회의 참석자를 고정으로 둔다).
 */
export interface AssigneeOption {
  id: number;
  name: string;
  /** "개발팀장"처럼 이름 뒤에 붙는 라벨. 없으면 빈 문자열(예: Owner). */
  roleLabel: string;
}

/** 근거 발화 — 수정 판단의 근거이므로 AI가 뽑은 항목엔 반드시 있다(WORKFLOW.md §3-4). */
export interface DraftEvidence {
  speaker: string;
  quote: string;
  /** 회의 안에서의 시각 `MM:SS` — 클릭하면 그 시점 스크립트로 이동(추후 연동). */
  timestamp: string;
}

/**
 * 액션 초안 한 건.
 *
 * ⚠️ `isManual`이면 `evidence`가 없다 — Host가 [액션 직접 추가]로 넣은 항목은
 *    회의 발화에서 뽑힌 게 아니라 근거를 달 수 없다.
 * ⚠️ `startDate`·`dueDate` 둘 다 이 화면에서 조정 가능하다(2026-08-07 팀 확정 — 보드·프로젝트
 *    상태 계산이 시작일을 쓰므로 액션도 동일 정책). [액션 분배 확정] 시점의 값이 최종이고
 *    그 뒤로 자동 변경되지 않는다.
 */
export interface AiActionDraft {
  id: string;
  title: string;
  /** 다른 액션 화면과 같은 필드(features/action/types.ts `description`) — 제목 아래 한 줄 요약. */
  description: string;
  assigneeId: number;
  confidence: AiConfidence;
  startDate: string;
  dueDate: string;
  evidence: DraftEvidence | null;
  isManual: boolean;
}

/** 리뷰 화면이 받는 조회 결과 한 판. */
export interface MeetingReviewInfo {
  meetingId: string;
  meetingTitle: string;
  /** 이 회의 개설자 — 마이페이지 "미확정 액션" 목록을 이 값으로 거른다(§3-4 "Host만 접근"). */
  hostId: number;
  projectTag: string;
  /** `8월 14일(목)` — 서버가 표기까지 만들어 보낸다(다른 화면과 동일 패턴). */
  scheduleLabel: string;
  assigneeOptions: AssigneeOption[];
  drafts: AiActionDraft[];
  /**
   * ⚠️ **1회성 화면 정책**(WORKFLOW.md §3-4): 이미 확정된 회의면 true — 화면이 이 값을 보고
   *    회의 상세로 리다이렉트한다(회의 상세 라우트 연동 전까지는 안내 문구로 대체).
   */
  actionsConfirmed: boolean;
}

/** 조회 결과 — 못 여는 이유까지 값으로 돌려준다(다른 화면의 `*Result` 패턴과 동일). */
export type MeetingReviewResult =
  | { kind: "ok"; review: MeetingReviewInfo }
  | { kind: "alreadyConfirmed"; meetingId: string }
  | { kind: "notHost" }
  | { kind: "notFound" };

/** [액션 직접 추가]로 새 초안 행을 만들 때 필요한 최소 입력. */
export interface ManualDraftInput {
  title: string;
  description: string;
  assigneeId: number;
  startDate: string;
  dueDate: string;
}

/**
 * 마이페이지 "미확정 액션" 목록의 한 줄 — 회의 하나당 한 줄이다.
 * ⚠️ 회의 제목으로 구분하고, 부제는 "분배 확정지어야 할 액션 N건"이다(사용자 확정, 2026-08-07).
 */
export interface PendingReviewSummary {
  meetingId: string;
  meetingTitle: string;
  actionCount: number;
}
