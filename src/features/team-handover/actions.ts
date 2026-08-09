"use server";

import { revalidatePath } from "next/cache";

import {
  completeMockHandoverMidApproval,
  rejectMockHandover,
} from "@/features/member/mock/managed";
import { TEAM_ACTION_PERSONAL_ITEMS_MOCK } from "@/features/project/mock/team-action-detail";
import { todayIso } from "@/lib/date";
import { isMock } from "@/mocks/config";

import { FIXED_LEADER_NAME, getTeamHandoverDetail } from "./server";
import type { TeamHandoverAssignment } from "./types";

const LIST_PATH = "/team/handover";
const MANAGE_PATH = "/manage/members";

function findPersonalItem(actionId: number) {
  for (const items of Object.values(TEAM_ACTION_PERSONAL_ITEMS_MOCK)) {
    const found = items.find((item) => item.id === actionId);
    if (found) return found;
  }
  return null;
}

/**
 * [인수인계 확정] — 팀원 보드로 재배정한 결과를 한 번에 반영하고 팀장 중간 승인을 남긴다
 * (WORKFLOW.md §7·§13-4).
 * ⚠️ **재배정 반영은 `board/actions.ts`와 같은 방식**이다 — `TEAM_ACTION_PERSONAL_ITEMS_MOCK`
 *    항목을 직접 mutate한다(별도 격리 저장소를 새로 두지 않는다).
 * ⚠️ 세션이 아직 없어(`getViewer()`가 항상 OWNER) 이 화면·액션은 `/team/(dashboard)`와 같이
 *    권한 게이트 없이 고정 스코프(김서준 · 개발팀)로 동작한다. 세션이 붙으면 첫 줄에서
 *    `assertPermission(canApproveMid(viewer, { teamId }))`를 넣는다.
 */
export async function completeTeamHandoverAction(
  memberId: number,
  assignments: TeamHandoverAssignment[],
): Promise<{ isSuccess: boolean; message?: string }> {
  if (!isMock) {
    throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
  }

  const handover = await getTeamHandoverDetail(memberId);
  if (!handover) return { isSuccess: false, message: "이미 처리됐거나 없는 인수인계서입니다" };

  // ⚠️ 화면의 "전부 배정" 제약은 UX일 뿐이다 — 여기서도 다시 본다(§권한: 화면 숨김은 보안이 아니다).
  const assignedIds = new Set(assignments.map((entry) => entry.actionId));
  const allAssigned = handover.actions.every((action) => assignedIds.has(action.id));
  if (!allAssigned) return { isSuccess: false, message: "아직 배정하지 않은 액션이 있습니다" };

  const teammateById = new Map(handover.teammates.map((teammate) => [teammate.id, teammate]));

  for (const { actionId, assigneeId } of assignments) {
    const teammate = teammateById.get(assigneeId);
    const item = findPersonalItem(actionId);
    if (!teammate || !item) continue;
    item.assigneeName = teammate.name;
    item.assigneeRoleLabel = teammate.roleLabel ?? undefined;
  }

  completeMockHandoverMidApproval(memberId, FIXED_LEADER_NAME, todayIso());

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${memberId}`);
  revalidatePath(`${MANAGE_PATH}/${memberId}`);

  return { isSuccess: true };
}

/**
 * [반려] — **팀장도 반려할 수 있다**(오너의 최종 승인/반려와 별개, 2026-08-09 팀 확정).
 * 인계 액션이 빠졌거나 잘못 배정된 걸 여기서 걸러내지 못하면 오너까지 올라간 뒤에야
 * 드러난다 — 팀장 선에서 먼저 막을 수 있어야 한다.
 * ⚠️ **아직 중간 승인 전인 신청만** 반려할 수 있다 — 이미 중간 승인해 올린 건은 오너의
 *    최종 승인/반려(`approveHandoverAction`/`rejectHandoverAction`) 몫이다.
 * ⚠️ 반려 결과는 오너의 반려와 같다(신청 자체를 지우고 재직으로 되돌린다) — 같은
 *    `rejectMockHandover` 뮤테이터를 그대로 쓴다.
 */
export async function rejectTeamHandoverAction(
  memberId: number,
  reason: string,
): Promise<{ isSuccess: boolean; message?: string }> {
  if (!isMock) {
    throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
  }

  if (!reason.trim()) return { isSuccess: false, message: "반려 사유를 입력해 주세요" };

  const handover = await getTeamHandoverDetail(memberId);
  if (!handover) return { isSuccess: false, message: "이미 처리됐거나 없는 인수인계서입니다" };

  /*
    ⚠️ 사유는 오너의 반려와 같은 이유로 **지금은 저장하지 않는다**(`handover-approval-card.tsx`
       주석 참고) — 저장할 자리도 보여줄 화면도 아직 없다. 연동되면 함께 보낸다.
  */
  rejectMockHandover(memberId);

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${memberId}`);
  revalidatePath(`${MANAGE_PATH}/${memberId}`);

  return { isSuccess: true };
}
