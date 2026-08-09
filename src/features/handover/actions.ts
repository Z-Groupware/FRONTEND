"use server";

import { HANDOVER_STATUS, HANDOVER_TYPE, type HandoverStatus } from "@/constants/domain";
import { isMock } from "@/mocks/config";

/** 휴직 신청 — 팀장이면 액션마다 담당자를 지정해 함께 보낸다(자가 재할당). */
export interface SubmitVacationHandoverPayload {
  type: typeof HANDOVER_TYPE.VACATION;
  startDate: string;
  endDate: string;
  actionIds: number[];
  /** 액션 id → 배정받을 팀원 id. 팀장 신청이 아니면 빈 객체. */
  assignments: Record<number, string>;
}

export interface SubmitOffboardingHandoverPayload {
  type: typeof HANDOVER_TYPE.OFFBOARDING;
  description: string;
  actionIds: number[];
}

export type SubmitHandoverPayload =
  SubmitVacationHandoverPayload | SubmitOffboardingHandoverPayload;

/**
 * [인수인계서 신청] — 접수만 한다.
 * ⚠️ `/team/handover`·`/owner/leader-handovers`(승인·재분배·귀속 화면)가 아직 없어
 *    이어줄 대상이 없다(별도 이슈) — 지금은 신청이 접수됐다는 결과만 mock으로 돌려준다.
 *    실제 저장·팀장 상신은 그 이슈에서 mock 스토어와 함께 연결한다.
 */
export async function submitHandoverAction(
  payload: SubmitHandoverPayload,
): Promise<{ status: HandoverStatus }> {
  if (!isMock) {
    throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
  }

  void payload;
  return { status: HANDOVER_STATUS.SUBMITTED };
}
