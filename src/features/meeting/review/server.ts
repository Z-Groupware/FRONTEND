import { requireAccessToken } from "@/features/auth/session";
import { getViewer } from "@/features/shell/viewer";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { canOperateMeeting } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { type BePendingActionDistributionsResponse, toPendingReviewSummary } from "./mapper";
import { findMockMeetingReview, listMockPendingReviewMeetingIds } from "./mock/review";
import type { MeetingReviewInfo, MeetingReviewResult, PendingReviewSummary } from "./types";

/**
 * AI 액션 분배 리뷰 조회.
 * ⚠️ **Host만 열 수 있다**(WORKFLOW.md §3-4). `canOperateMeeting`은 AI 검토를 포함해
 *    회의 담당자 1명만 허용하는 그 판정을 이미 하고 있어 그대로 재사용한다.
 * ⚠️ **1회성 화면 정책** — 이미 확정된 회의는 `alreadyConfirmed`를 돌려주고
 *    화면(`page.tsx`)이 회의 상세로 리다이렉트한다.
 */
export async function getMeetingReview(meetingId: string): Promise<MeetingReviewResult> {
  const review = findMockMeetingReview(meetingId);
  if (!review) return { kind: "notFound" };
  const viewer = await getViewer();
  if (!canOperateMeeting(viewer, { ownerId: review.hostId })) return { kind: "notHost" };
  if (review.actionsConfirmed) return { kind: "alreadyConfirmed", meetingId };
  return { kind: "ok", review };
}

/**
 * 마이페이지 "미확정 액션" 탭 — 이 사람이 Host이고 아직 [액션 분배 확정]을 안 누른
 * 회의만 회의 제목 단위로 모아 보여준다(WORKFLOW.md §3-4 "Host만 접근"과 같은 축).
 *
 * ⚠️ `GET /api/meetings/pending-action-distributions`(MEET-10, 구현 완료)는 **서버가 이미
 *    host 본인 회의로 스코프한다** — 역할이 아니라 `hostMemberId` 일치가 기준이라 OWNER·ADMIN도
 *    남의 회의는 안 온다. 그래서 실서버 경로엔 `viewerId` 필터가 없다(목 경로만 직접 거른다).
 */
export async function listPendingReviewsForViewer(
  viewerId: number,
): Promise<PendingReviewSummary[]> {
  if (!isMock) {
    const accessToken = await requireAccessToken();
    const { meetings } = await serverApi<BePendingActionDistributionsResponse>(
      ep.meetingsPendingActionDistributions(),
      { accessToken },
    );
    return meetings.map(toPendingReviewSummary);
  }

  return listMockPendingReviewMeetingIds()
    .map((meetingId) => findMockMeetingReview(meetingId))
    .filter((review): review is MeetingReviewInfo => review !== null)
    .filter((review) => review.hostId === viewerId && !review.actionsConfirmed)
    .map((review) => ({
      meetingId: review.meetingId,
      meetingTitle: review.meetingTitle,
      actionCount: review.drafts.length,
    }));
}
