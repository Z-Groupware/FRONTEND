import "server-only";

import { isMock } from "@/mocks/config";

import { listMockEvents } from "./mock/events";
import type { PersonalCalendarEvent } from "./types";

/**
 * 개인 캘린더 — 그 달에 속한 항목만 걸러 내려준다. **격리막**(CLAUDE.md).
 * 연동할 때 고칠 곳은 이 파일과 매퍼뿐이고 컴포넌트는 건드리지 않는다.
 */
export async function getMonthEvents(month: Date): Promise<PersonalCalendarEvent[]> {
  if (isMock) {
    return listMockEvents().filter(
      (event) =>
        event.start.getFullYear() === month.getFullYear() &&
        event.start.getMonth() === month.getMonth(),
    );
  }

  // ⚠️ 미구현 — API 스펙 확정 후 개인 Todo·액션 조회 경로를 합쳐 매퍼로 UI 계약에 맞춘다.
  throw new Error("개인 캘린더 조회 API가 아직 연결되지 않았습니다.");
}
