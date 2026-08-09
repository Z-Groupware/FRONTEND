"use server";

import { revalidatePath } from "next/cache";

import { isMock } from "@/mocks/config";

import { findMockLeaderHandover, markMockLeaderHandoverAssigned } from "./mock/leader-handovers";

/**
 * [OOO에게 귀속] — 이 인수인계서에 담긴 액션 전체의 담당자를 새 팀장에게 일괄 이전한다
 * (WORKFLOW.md §7).
 * ⚠️ 실제 액션 도메인(보드·내 액션 등)에 담당자를 반영하는 매퍼는 ERD 확정 후 연결한다
 *    (CLAUDE.md §Mock 격리막) — 지금은 이 화면의 귀속 상태 전환만 담당한다.
 * ⚠️ 사원 관리 승인 흐름과의 실제 연동(승인 시 이 목록에 새로 생기는 것)은 범위 밖이다
 *    (별도 이슈, 2026-08-08 사용자 확인).
 */
export async function assignLeaderHandoverAction(
  handoverId: string,
  newLeaderId: string,
): Promise<{ isSuccess: boolean }> {
  if (!isMock) {
    throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
  }

  const handover = findMockLeaderHandover(handoverId);
  if (!handover) return { isSuccess: false };
  if (!handover.candidates.some((candidate) => candidate.id === newLeaderId)) {
    return { isSuccess: false };
  }

  markMockLeaderHandoverAssigned(handoverId);

  revalidatePath("/owner/leader-handovers");
  revalidatePath(`/owner/leader-handovers/${handoverId}`);

  return { isSuccess: true };
}
