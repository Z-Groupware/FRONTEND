"use server";

import { revalidatePath } from "next/cache";

import type { ActionRejectReason } from "@/constants/meeting";
import { getViewer } from "@/features/shell/viewer";
import { assertPermission, canOperateMeeting } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { findMockMeetingReview, markMockReviewConfirmed } from "./mock/review";
import type { ManualDraftInput } from "./types";

/** Host가 [확정] 누른 시점의 초안 한 건 — 반려 안 된 것만 여기 담겨 온다. */
export interface ConfirmedDraftInput {
  id: string;
  title: string;
  description: string;
  assigneeId: number;
  startDate: string;
  dueDate: string;
}

/** ✕로 뺀 초안 — 사유를 남긴다(WORKFLOW.md §3-4, 추후 AI 피드백용). */
export interface RejectedDraftInput {
  id: string;
  reason: ActionRejectReason;
}

export interface ConfirmActionDistributionPayload {
  confirmed: ConfirmedDraftInput[];
  rejected: RejectedDraftInput[];
  manuallyAdded: ManualDraftInput[];
}

export type ConfirmActionDistributionResult =
  | { status: "confirmed"; createdCount: number }
  | { status: "alreadyConfirmed" | "notFound"; createdCount: 0 };

/**
 * [액션 분배 확정] — 반려 안 된 초안 + 직접 추가한 항목으로 실제 팀/개인 액션을 생성한다.
 * ⚠️ **되돌릴 수 없다**(1회성 화면 정책, WORKFLOW.md §3-4) — 확정 뒤 이 화면에 다시 못 들어온다.
 * ⚠️ **Host만 확정할 수 있다** — 화면 버튼 숨김은 보안이 아니라 여기서도 다시 검사한다
 *    (`canOperateMeeting`, CLAUDE.md §권한).
 * ⚠️ 실제 액션 도메인(보드·내 액션 등)에 레코드를 만드는 매퍼는 ERD 확정 후 연결한다
 *    (CLAUDE.md §Mock 격리막) — 지금은 리뷰 화면 자체의 확정 흐름만 담당한다.
 */
export async function confirmActionDistributionAction(
  meetingId: string,
  payload: ConfirmActionDistributionPayload,
): Promise<ConfirmActionDistributionResult> {
  if (!isMock) {
    throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
  }

  const review = findMockMeetingReview(meetingId);
  if (!review) return { status: "notFound", createdCount: 0 };

  const viewer = await getViewer();
  assertPermission(canOperateMeeting(viewer, { ownerId: review.hostId }));

  if (review.actionsConfirmed) return { status: "alreadyConfirmed", createdCount: 0 };

  markMockReviewConfirmed(meetingId);

  revalidatePath(`/app/meeting/${meetingId}/review`);
  revalidatePath(`/app/meeting/${meetingId}`);

  return {
    status: "confirmed",
    createdCount: payload.confirmed.length + payload.manuallyAdded.length,
  };
}
