"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/features/shell/viewer";
import { canOperateMeeting } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { findMockStalledSummary, removeMockStalledSummary } from "./mock/stalled-summaries";

/**
 * [다시 분석] — 재분석 큐에 다시 넣는다.
 * ⚠️ 실제 재분석 API 경로가 아직 BE와 확정 전이다(§연동 검증, BE #177 관련 요청함) —
 *    지금은 mock으로 "목록에서 빠진다"까지만 흉내낸다.
 * ⚠️ Host만 요청할 수 있다 — 화면 버튼 숨김은 보안이 아니다(CLAUDE.md §권한).
 */
export async function retryMeetingSummaryAction(meetingId: string): Promise<void> {
  if (!isMock) {
    throw new Error("서버 연동 미구현 — 재분석 API 경로 확정 후 매퍼 작성");
  }

  const item = findMockStalledSummary(meetingId);
  if (!item) return;

  const viewer = await getViewer();
  if (!canOperateMeeting(viewer, { ownerId: item.hostId })) {
    throw new Error("권한이 없습니다.");
  }

  removeMockStalledSummary(meetingId);
  revalidatePath("/app/me");
}
