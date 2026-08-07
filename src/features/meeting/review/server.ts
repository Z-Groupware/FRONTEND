import { getViewer } from "@/features/shell/viewer";
import { canOperateMeeting } from "@/lib/permission";

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
 */
export async function listPendingReviewsForViewer(
  viewerId: number,
): Promise<PendingReviewSummary[]> {
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
