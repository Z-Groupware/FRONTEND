import { isDelayed } from "@/constants/domain";
import type { TimelineActionInput } from "@/features/member/action-timeline";
import { pickPaletteColor } from "@/lib/palette";

import type { TeamHandoverAction, TeamHandoverAssignment } from "./types";

/** 액션 → 타임라인 입력. 칩에는 프로젝트 태그를 단다(호출부 관례, §CONVENTIONS). */
export function buildTimelineInput(actions: TeamHandoverAction[]): TimelineActionInput[] {
  return actions.map((action) => {
    const color = pickPaletteColor(action.projectTag);
    return {
      id: String(action.id),
      tag: action.projectTag,
      title: action.title,
      tagBgColor: color.bgColor,
      tagTextColor: color.textColor,
      startDate: action.startDate,
      dueDate: action.dueDate,
      tone: isDelayed(action) ? "DELAYED" : action.status,
    };
  });
}

/** 모든 액션이 배정됐는지 — [인수인계 확정] 버튼 활성 조건. */
export function isReadyToComplete(
  actions: TeamHandoverAction[],
  assignments: Record<number, number>,
): boolean {
  return actions.length > 0 && actions.every((action) => assignments[action.id] !== undefined);
}

/** 배정 맵 → 서버로 보낼 배열. */
export function toAssignmentList(assignments: Record<number, number>): TeamHandoverAssignment[] {
  return Object.entries(assignments).map(([actionId, assigneeId]) => ({
    actionId: Number(actionId),
    assigneeId,
  }));
}
