import { listMockStalledSummaries } from "./mock/stalled-summaries";
import type { StalledSummaryInfo } from "./types";

/**
 * 마이페이지 "요약이 중단된 회의" 목록 — 이 사람이 Host인 것만 모아 보여준다
 * (WORKFLOW.md §3-4 "Host만 접근"과 같은 축, `review/server.ts`의
 * `listPendingReviewsForViewer`와 같은 패턴).
 */
export async function listStalledSummariesForViewer(
  viewerId: number,
): Promise<StalledSummaryInfo[]> {
  return listMockStalledSummaries()
    .filter((item) => item.hostId === viewerId)
    .map(({ meetingId, meetingTitle, isStalled }) => ({ meetingId, meetingTitle, isStalled }));
}
