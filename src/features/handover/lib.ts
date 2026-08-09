import { HANDOVER_TYPE, type HandoverType } from "@/constants/domain";

import type { HandoverActionItem } from "./types";

/**
 * ⚠️ **임시 미리보기 토글**(사용자 요청, 2026-08-08) — 로그인이 아직 없어 "지금 보고
 *    있는 사람"을 화면에서 바로 바꿔볼 수 있게 둔 것. 실제 세션이 붙으면 이 토글과
 *    `?as=`는 걷어내고 `getViewer()`가 그 자리를 대신한다.
 */
export const HANDOVER_PREVIEW = {
  MEMBER: "member",
  LEADER: "leader",
} as const;
export type HandoverPreview = (typeof HANDOVER_PREVIEW)[keyof typeof HANDOVER_PREVIEW];

export const HANDOVER_PREVIEW_LABEL: Record<HandoverPreview, string> = {
  member: "팀원(이하윤)",
  leader: "팀장(김서준)",
};

export const HANDOVER_PREVIEW_TABS: { preview: HandoverPreview; label: string }[] = [
  HANDOVER_PREVIEW.MEMBER,
  HANDOVER_PREVIEW.LEADER,
].map((preview) => ({ preview, label: HANDOVER_PREVIEW_LABEL[preview] }));

export const DEFAULT_HANDOVER_PREVIEW: HandoverPreview = HANDOVER_PREVIEW.MEMBER;

export function parseHandoverPreview(value: string | undefined): HandoverPreview {
  return (
    HANDOVER_PREVIEW_TABS.find((t) => t.preview === value)?.preview ?? DEFAULT_HANDOVER_PREVIEW
  );
}

export const HANDOVER_TYPE_TABS: { type: HandoverType; label: string }[] = [
  HANDOVER_TYPE.VACATION,
  HANDOVER_TYPE.OFFBOARDING,
].map((type) => ({
  type,
  label: type === HANDOVER_TYPE.VACATION ? "휴직" : "오프보딩",
}));

export const DEFAULT_HANDOVER_TYPE: HandoverType = HANDOVER_TYPE.VACATION;

export function parseHandoverType(value: string | undefined): HandoverType {
  return HANDOVER_TYPE_TABS.find((t) => t.type === value)?.type ?? DEFAULT_HANDOVER_TYPE;
}

/** 마감일이 휴직 기간(양끝 포함) 안에 드는지 — `YYYY-MM-DD` 문자열 비교로 충분하다. */
export function isDueWithinRange(dueDate: string, startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  return dueDate >= startDate && dueDate <= endDate;
}

/**
 * 절충안(사용자 확정, 2026-08-08): 기간 밖 액션도 **숨기지 않는다** — 목록은 항상 전체를
 * 보여주고, 기간과 겹치는 것만 위로 정렬 + 배지로 표시한다. 필터로 감추면 "마감일은
 * 아니어도 자리를 비우면 인계가 필요한" 액션을 사용자가 잊어버릴 수 있다(§정직성).
 * ⚠️ **기본 체크는 안 한다**(2026-08-08 정정) — 인계할 생각이 없던 액션까지 체크돼
 *    있으면 오히려 하나씩 해제해야 해서 번거롭다. 정렬·배지까지만 돕고 선택은 전부
 *    사용자 몫으로 둔다.
 */
export function sortActionsForVacation(
  actions: HandoverActionItem[],
  startDate: string,
  endDate: string,
): { sorted: HandoverActionItem[]; inRangeIds: Set<number> } {
  const inRangeIds = new Set(
    actions
      .filter((action) => isDueWithinRange(action.dueDate, startDate, endDate))
      .map((a) => a.id),
  );
  const sorted = [...actions].sort((a, b) => {
    const aIn = inRangeIds.has(a.id) ? 0 : 1;
    const bIn = inRangeIds.has(b.id) ? 0 : 1;
    return aIn - bIn;
  });
  return { sorted, inRangeIds };
}
