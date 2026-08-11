"use server";

import { HANDOVER_STATUS, type HandoverStatus } from "@/constants/domain";
import { isMock } from "@/mocks/config";

import type { SubmitHandoverPayload } from "./lib";

export type {
  SubmitHandoverPayload,
  SubmitOffboardingHandoverPayload,
  SubmitVacationHandoverPayload,
} from "./lib";

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
