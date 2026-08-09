"use server";

import { revalidatePath } from "next/cache";

import { LEADER_HANDOVER_CUSTODY_STATUS } from "@/constants/domain";
import { getViewer } from "@/features/shell/viewer";
import { canManageLeaderHandovers } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { findMockLeaderHandover, markMockLeaderHandoverAssigned } from "./mock/leader-handovers";

/**
 * [OOO에게 귀속] — 이 인수인계서에 담긴 액션 전체의 담당자를 새 팀장에게 일괄 이전한다
 * (WORKFLOW.md §7).
 * ⚠️ 실제 액션 도메인(보드·내 액션 등)에 담당자를 반영하는 매퍼는 ERD 확정 후 연결한다
 *    (CLAUDE.md §Mock 격리막) — 지금은 이 화면의 귀속 상태 전환만 담당한다.
 * ⚠️ 사원 관리 승인 흐름과의 실제 연동(승인 시 이 목록에 새로 생기는 것)은 범위 밖이다
 *    (별도 이슈, 2026-08-08 사용자 확인).
 * ⚠️ **화면 권한 체크는 페이지가 하지만 이 Action은 따로 재검사한다**(§권한: 화면 숨김은
 *    보안이 아니다) — 주소만 알면 페이지를 거치지 않고 이 Action을 직접 부를 수 있다.
 *    이미 귀속 완료(`ASSIGNED`)된 건도 다시 못 돌린다 — 일괄 이전은 한 번뿐이다.
 */
export async function assignLeaderHandoverAction(
  handoverId: string,
  newLeaderId: string,
): Promise<{ isSuccess: boolean }> {
  const viewer = await getViewer();
  if (!canManageLeaderHandovers(viewer)) return { isSuccess: false };

  if (!isMock) {
    throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
  }

  const handover = findMockLeaderHandover(handoverId);
  if (!handover) return { isSuccess: false };
  if (handover.custodyStatus !== LEADER_HANDOVER_CUSTODY_STATUS.PENDING) {
    return { isSuccess: false };
  }
  if (!handover.candidates.some((candidate) => candidate.id === newLeaderId)) {
    return { isSuccess: false };
  }

  markMockLeaderHandoverAssigned(handoverId);

  revalidatePath("/owner/leader-handovers");
  revalidatePath(`/owner/leader-handovers/${handoverId}`);

  return { isSuccess: true };
}
