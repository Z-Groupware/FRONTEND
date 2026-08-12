"use server";

import { revalidatePath } from "next/cache";

import type { ActionRejectReason } from "@/constants/meeting";
import { requireAccessToken } from "@/features/auth/session";
import { getViewer } from "@/features/shell/viewer";
import { ApiError, serverApi, toUserMessage } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { assertPermission, canOperateMeeting } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { findMockMeetingReview, markMockReviewConfirmed } from "./mock/review";
import type { ManualDraftInput } from "./types";

/**
 * Host가 [확정] 누른 시점의 판정 한 건 — 반려 안 된 AI 초안이 여기 담겨 온다.
 *
 * ⚠️ **고친 칸만 `changes`에 싣는다**(2026-08-12, BE RVW-02 대조). BE는 바뀐 필드를 보고
 *    `WRONG_ASSIGNEE` 같은 라벨을 자동으로 만들어 AI 학습 재료로 쓴다 — 안 고친 값까지
 *    "고쳤다"고 보내면 **틀린 배정을 AI에게 가르치는 셈**이다. `changes`가 비면 CONFIRM,
 *    있으면 MODIFY로 나간다.
 * ⚠️ `plannedStartDate`는 `changes` 밖이다 — AI가 내지 않는 값이라 "고침"이 아니라
 *    "사람이 처음 정함"이고, CONFIRM에도 실을 수 있다(BE가 검사에서 일부러 뺐다).
 */
export interface ReviewedDraftInput {
  /** BE `actionId` 문자열 */
  id: string;
  /** 정했을 때만 — 빈 값이면 안 보낸다 */
  plannedStartDate?: string;
  changes?: {
    title?: string;
    description?: string;
    assigneeId?: number;
    dueDate?: string;
  };
}

/** ✕로 뺀 초안 — 사유를 남긴다(WORKFLOW.md §3-4, AI 피드백용 라벨이 된다). */
export interface RejectedDraftInput {
  id: string;
  reason: ActionRejectReason;
}

export interface ConfirmActionDistributionPayload {
  reviewed: ReviewedDraftInput[];
  rejected: RejectedDraftInput[];
  manuallyAdded: ManualDraftInput[];
}

export type ConfirmActionDistributionResult =
  | { status: "confirmed"; createdCount: number; skippedCount: number }
  | { status: "alreadyConfirmed" | "notFound"; createdCount: 0 }
  /** 확인되지 않은 STT 구간 등으로 BE가 확정을 멈췄다(409) — `force`로만 강행한다 */
  | { status: "blocked"; message: string }
  | { status: "failed"; message: string };

/** BE RVW-05 응답 — [확인] `DistributionConfirmResponse.java` */
interface BeDistributionConfirm {
  dispatchedCount: number;
  dispatchedAt: string | null;
  /** reason: `STILL_PENDING` · `REJECTED` · `NO_ASSIGNEE` · `ALREADY_DISPATCHED` */
  skipped: { actionId: number; reason: string }[];
}

/**
 * [액션 분배 확정] — 반려 안 된 초안 + 직접 추가한 항목으로 실제 팀/개인 액션을 생성한다.
 * ⚠️ **되돌릴 수 없다**(1회성 화면 정책, WORKFLOW.md §3-4) — 확정 뒤 이 화면에 다시 못 들어온다.
 * ⚠️ **화면은 확정 전까지 전부 로컬 상태다**(팀 확정 2026-08-10 "자동 반영 완료 로직 폐기").
 *    BE는 항목별 판정(RVW-02)을 따로 받는 모델이라, 이 액션이 확정 시점에 **판정 → 추가 →
 *    확정을 순서대로 대신 보낸다** — UX는 팀 확정대로 두고 API 계약만 맞춘다.
 * ⚠️ **중간에 끊겨도 다시 누르면 이어진다.** 판정을 다시 보내면 라벨 행이 하나 더 쌓일 뿐
 *    값이 어긋나지는 않는다(BE 주석). 반려해 둔 항목은 재조회가 걸러 준다(매퍼).
 */
export async function confirmActionDistributionAction(
  meetingId: string,
  payload: ConfirmActionDistributionPayload,
  options?: { force?: boolean },
): Promise<ConfirmActionDistributionResult> {
  if (isMock) return confirmMockDistribution(meetingId, payload);

  const accessToken = await requireAccessToken();
  const id = Number(meetingId);

  try {
    /* ① 반려 — 값은 안 실린다(BE가 무시한다). 사유 코드만 판정으로 남는다. */
    for (const rejected of payload.rejected) {
      await serverApi(ep.meetingReviewDecision(id, Number(rejected.id)), {
        method: "PATCH",
        accessToken,
        json: { decision: "REJECT", rejectReason: rejected.reason },
      });
    }

    /* ② 판정 — 고친 칸만 MODIFY, 그대로면 CONFIRM(값 실으면 422라 changes로 가른다) */
    for (const draft of payload.reviewed) {
      const changes = draft.changes ?? {};
      const value = {
        ...(changes.assigneeId !== undefined ? { assigneeMemberId: changes.assigneeId } : {}),
        ...(changes.dueDate !== undefined ? { dueDate: changes.dueDate } : {}),
        ...(changes.title !== undefined ? { title: changes.title } : {}),
        ...(changes.description !== undefined ? { detail: changes.description } : {}),
        ...(draft.plannedStartDate ? { plannedStartDate: draft.plannedStartDate } : {}),
      };
      const isModify = Object.keys(changes).length > 0;

      await serverApi(ep.meetingReviewDecision(id, Number(draft.id)), {
        method: "PATCH",
        accessToken,
        json: isModify
          ? { decision: "MODIFY", value }
          : {
              decision: "CONFIRM",
              ...(draft.plannedStartDate
                ? { value: { plannedStartDate: draft.plannedStartDate } }
                : {}),
            },
      });
    }

    /* ③ 직접 추가 — RVW-03에는 시작일 칸이 없어, 만들어진 id로 MODIFY를 뒤따라 보낸다 */
    for (const manual of payload.manuallyAdded) {
      const added = await serverApi<{ actionId: number }>(ep.meetingReviewAddAction(id), {
        method: "POST",
        accessToken,
        json: {
          assigneeMemberId: manual.assigneeId,
          title: manual.title,
          detail: manual.description,
          dueDate: manual.dueDate,
          evidenceTranscriptId: null,
        },
      });
      if (manual.startDate) {
        await serverApi(ep.meetingReviewDecision(id, added.actionId), {
          method: "PATCH",
          accessToken,
          json: { decision: "MODIFY", value: { plannedStartDate: manual.startDate } },
        });
      }
    }

    /* ④ 확정 — 여기서부터 액션이 각자의 보드로 나간다. Host 아니면 BE가 403으로 막는다. */
    const result = await serverApi<BeDistributionConfirm>(
      ep.meetingReviewConfirm(id, options?.force ?? false),
      { method: "POST", accessToken },
    );

    revalidatePath(`/app/meeting/${meetingId}/review`);
    revalidatePath(`/app/meeting/${meetingId}`);

    /* 전부 "지난 확정에서 이미 나감"이면 다른 탭이 먼저 확정한 것이다 */
    const alreadyDispatched =
      result.dispatchedCount === 0 &&
      result.skipped.length > 0 &&
      result.skipped.every((skip) => skip.reason === "ALREADY_DISPATCHED");
    if (alreadyDispatched) return { status: "alreadyConfirmed", createdCount: 0 };

    return {
      status: "confirmed",
      createdCount: result.dispatchedCount,
      /*
        ⚠️ 반려(`REJECTED`)는 **의도한 제외**라 세지 않는다. 남는 건 미검토·담당자 미정처럼
           사람이 몰랐을 수 있는 것들이다 — 조용히 넘기면 검토가 끝난 줄 알고 화면을 닫는다
           (BE 주석: "skipped가 절반이다").
      */
      skippedCount: result.skipped.filter((skip) => skip.reason !== "REJECTED").length,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { status: "notFound", createdCount: 0 };
      /* 확인되지 않은 STT 구간·미검토가 남았다 — 사람이 알고 강행할지 정한다(§정직성) */
      if (error.status === 409) return { status: "blocked", message: error.message };
    }
    return { status: "failed", message: toUserMessage(error) };
  }
}

/** 목 — 기존 흐름 그대로. 권한 재검사까지 목 경로에서도 같은 함수로 한다(§권한). */
async function confirmMockDistribution(
  meetingId: string,
  payload: ConfirmActionDistributionPayload,
): Promise<ConfirmActionDistributionResult> {
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
    createdCount: payload.reviewed.length + payload.manuallyAdded.length,
    skippedCount: 0,
  };
}
