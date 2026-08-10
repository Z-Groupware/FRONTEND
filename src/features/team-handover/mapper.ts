import type { ActionStatus, HandoverStatusBe, HandoverType } from "@/constants/domain";
import { HANDOVER_TYPE, type HandoverStatus, mapHandoverStatusFromBe } from "@/constants/domain";

import type { TeamHandoverAction } from "./types";

/**
 * BE shape → UI 계약 (§Mock 격리막 — **shape을 흡수하는 곳은 여기 하나다**).
 * [확인] 인수인계 API 연동 가이드(BE 실코드 대조, 2026-08-10) §2 `GET /api/handovers/{id}`.
 *
 * ⚠️ 컴포넌트는 이 파일을 모른다. BE가 모양을 바꾸면 여기만 고친다.
 */

/** [확인] BE `HandoverItemResponse` — 인수인계서 한 건에 담긴 액션 스냅샷 한 줄. */
export interface BeHandoverItemResponse {
  id: number;
  actionId: number;
  actionTitleSnap: string;
  actionStatusSnap: string;
  projectTagSnap: string;
  actionTypeSnap: string;
  deadlineSnap: string;
  actionCreatedAtSnap: string;
  sourceMeetingId: number | null;
  sourceMeetingTitleSnap: string | null;
  contentSnap: string | null;
  reassignRequired: boolean;
  reassigneeId: number | null;
  reassigneeNameSnap: string | null;
  reassigneePositionSnap: string | null;
  reassignedAt: string | null;
  committedAt: string | null;
  rollbackStatus: string | null;
}

/** [확인] BE `HandoverResponse` — 인수인계서 상세(전 필드 aggregate). */
export interface BeHandoverResponse {
  id: number;
  writerMemberId: number;
  teamId: number;
  teamNameSnap: string;
  handoverType: string;
  status: string;
  leaveStartAt: string | null;
  leaveEndAt: string | null;
  lastWorkingDay: string | null;
  writerNameSnap: string;
  writerPositionSnap: string;
  note: string | null;
  intermediateApproverId: number | null;
  intermediateApproverNameSnap: string | null;
  intermediateApprovedAt: string | null;
  rejectReason: string | null;
  finalizedAt: string | null;
  finalApproverId: number | null;
  finalApproverNameSnap: string | null;
  version: number;
  items: BeHandoverItemResponse[];
}

/**
 * BE 인수인계서 detail — 화면 카드가 쓰는 `TeamHandoverListItem`/`TeamHandoverDetail`(`id`가
 * 사원 id를 문자열로 재활용하는 mock 전용 구조)과는 다르게, **진짜 인수인계서 id**를
 * `handoverId`로 따로 둔다. mock→live 전환 때 이 타입을 기준으로 화면 계약을 다시 잡는다.
 */
export interface HandoverDetailFromBe {
  handoverId: number;
  memberId: number;
  memberName: string;
  type: HandoverType;
  status: HandoverStatus;
  period: { from: string; to: string } | null;
  actionCount: number;
  actions: TeamHandoverAction[];
}

/**
 * 응답 항목(`HandoverItemResponse`) → 화면 액션 한 줄.
 * `actionTitleSnap`→`title`, `projectTagSnap`→`projectTag`, `deadlineSnap`→`dueDate`,
 * `actionStatusSnap`→`status`.
 *
 * ⚠️ **`parentTeamActionName`·`startDate` 소스가 BE 응답에 없다** — `HandoverItemResponse`엔
 *    상위 팀 액션명 필드도, 작업 시작일 필드도 없다(회의 제목(`sourceMeetingTitleSnap`)은
 *    다른 개념이라 대신 쓰지 않는다). 지어내지 않고 빈 값으로 둔다 — **BE에 확인 필요.**
 */
export function toTeamHandoverAction(item: BeHandoverItemResponse): TeamHandoverAction {
  return {
    id: item.actionId,
    projectTag: item.projectTagSnap,
    parentTeamActionName: "",
    title: item.actionTitleSnap,
    status: item.actionStatusSnap as ActionStatus,
    startDate: "",
    dueDate: item.deadlineSnap,
  };
}

/** `HandoverResponse` → 화면이 쓸 상세. 상태는 경계에서 `mapHandoverStatusFromBe`로 변환한다. */
export function toHandoverDetailFromBe(be: BeHandoverResponse): HandoverDetailFromBe {
  const type = be.handoverType as HandoverType;
  const period =
    type === HANDOVER_TYPE.VACATION && be.leaveStartAt && be.leaveEndAt
      ? { from: be.leaveStartAt.slice(0, 10), to: be.leaveEndAt.slice(0, 10) }
      : null;

  return {
    handoverId: be.id,
    memberId: be.writerMemberId,
    memberName: be.writerNameSnap,
    type,
    status: mapHandoverStatusFromBe(be.status as HandoverStatusBe),
    period,
    actionCount: be.items.length,
    actions: be.items.map(toTeamHandoverAction),
  };
}
