import { getDaysUntilDue, isDueSoon, MEETING_MAX_ITEMS } from "./lib";
import { MEMBER_ACTIONS_MOCK, MEMBER_ATTENDED_MEETINGS_MOCK } from "./mock/dashboard";
import type { MemberDashboardOverview } from "./types";

// ⚠️ ERD·API 스펙 미확정(BE 협의 전) — 지금은 목 고정. 확정되면 이 분기만 손댄다.
const isMock = true;

export async function getMemberDashboardOverview(): Promise<MemberDashboardOverview> {
  if (isMock) {
    return {
      // 마감 7일 이내(연체 포함)·미완료만, 마감 임박순(연체가 맨 위). 개수 제한 없음 → 박스 내부 스크롤
      dueSoonActions: MEMBER_ACTIONS_MOCK.filter(isDueSoon).sort(
        (a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate),
      ),
      // 최신순 5건
      attendedMeetings: [...MEMBER_ATTENDED_MEETINGS_MOCK]
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
        .slice(0, MEETING_MAX_ITEMS),
    };
  }
  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}
