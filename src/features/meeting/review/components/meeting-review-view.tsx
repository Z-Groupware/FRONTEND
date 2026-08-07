"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { type ActionRejectReason, AI_CONFIDENCE } from "@/constants/meeting";

import { confirmActionDistributionAction } from "../actions";
import type { AiActionDraft, ManualDraftInput, MeetingReviewInfo } from "../types";
import { ActionReviewGroup } from "./action-review-group";
import { ActionReviewRow } from "./action-review-row";
import { ManualDraftForm } from "./manual-draft-form";
import { RejectReasonDialog } from "./reject-reason-dialog";
import { ReviewLeaveGuard } from "./review-leave-guard";

let nextManualId = 1;

interface MeetingReviewViewProps {
  review: MeetingReviewInfo;
}

/**
 * AI 액션 분배 리뷰 — 화면(`/app/meeting/:id/review`)의 클라이언트 오케스트레이션.
 * ⚠️ 확정 전까지는 전부 **로컬 상태**다. [액션 분배 확정]을 눌러야 서버에 반영된다
 *    (WORKFLOW.md §3-4 "자동 반영 완료 로직 폐기").
 */
export function MeetingReviewView({ review }: MeetingReviewViewProps) {
  const [drafts, setDrafts] = useState<AiActionDraft[]>(review.drafts);
  const [rejectedReasons, setRejectedReasons] = useState<Record<string, ActionRejectReason>>({});
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [pendingReason, setPendingReason] = useState<ActionRejectReason | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleDrafts = drafts.filter((draft) => !(draft.id in rejectedReasons));
  const highConfidence = visibleDrafts.filter((d) => d.confidence === AI_CONFIDENCE.HIGH);
  const needsReview = visibleDrafts.filter((d) => d.confidence === AI_CONFIDENCE.NEEDS_REVIEW);
  const rejectTarget = rejectTargetId
    ? (drafts.find((d) => d.id === rejectTargetId) ?? null)
    : null;

  function updateDraft(id: string, patch: Partial<AiActionDraft>) {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  function openRejectDialog(id: string) {
    setRejectTargetId(id);
    setPendingReason(null);
  }

  function confirmReject() {
    if (!rejectTargetId || !pendingReason) return;
    setRejectedReasons((prev) => ({ ...prev, [rejectTargetId]: pendingReason }));
    setRejectTargetId(null);
  }

  function addManualDraft(input: ManualDraftInput) {
    setDrafts((prev) => [
      ...prev,
      {
        id: `manual-${nextManualId++}`,
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        confidence: AI_CONFIDENCE.NEEDS_REVIEW,
        startDate: input.startDate,
        dueDate: input.dueDate,
        evidence: null,
        isManual: true,
      },
    ]);
    setIsAddingManual(false);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmActionDistributionAction(review.meetingId, {
        // ⚠️ 직접 추가한 항목은 `manuallyAdded`로 따로 보낸다 — 여기 넣으면 아래와 겹쳐 이중 집계된다.
        confirmed: visibleDrafts
          .filter((draft) => !draft.isManual)
          .map((draft) => ({
            id: draft.id,
            title: draft.title,
            description: draft.description,
            assigneeId: draft.assigneeId,
            startDate: draft.startDate,
            dueDate: draft.dueDate,
          })),
        rejected: Object.entries(rejectedReasons).map(([id, reason]) => ({ id, reason })),
        manuallyAdded: drafts
          .filter((draft) => draft.isManual && !(draft.id in rejectedReasons))
          .map((draft) => ({
            title: draft.title,
            description: draft.description,
            assigneeId: draft.assigneeId,
            startDate: draft.startDate,
            dueDate: draft.dueDate,
          })),
      });
      setConfirmOpen(false);
      setIsConfirmed(true);
      toast(`${result.createdCount}건의 액션을 분배했습니다`);
    });
  }

  if (isConfirmed) {
    return (
      <section className="border-border bg-card rounded-2xl border px-7 py-10 text-center">
        <p className="text-[15px] leading-6 font-medium">액션 분배를 확정했습니다.</p>
        <p className="text-muted-foreground mt-1 text-[13px] leading-5">
          이 화면은 다시 열 수 없습니다 — 확정 결과는 각 액션 상세에서 확인해 주세요.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <ReviewLeaveGuard isBlocked />

      <div>
        <h1 className="text-[22px] leading-[30px] font-semibold tracking-[-0.4px]">
          AI가 처리한 액션 분배 결과가 나왔습니다!
        </h1>
        <p className="text-muted-foreground mt-1 text-[13px] leading-5">
          {review.meetingTitle} · {review.scheduleLabel}
        </p>
        <p className="text-muted-foreground mt-3 text-[12px] leading-4">
          두 그룹 모두 확정 전까지 내용·담당자·시작일·마감일을 수정할 수 있습니다.
        </p>
      </div>

      <ActionReviewGroup confidence={AI_CONFIDENCE.HIGH} count={highConfidence.length}>
        {highConfidence.map((draft) => (
          <ActionReviewRow
            key={draft.id}
            draft={draft}
            assigneeOptions={review.assigneeOptions}
            onTitleChange={(title) => updateDraft(draft.id, { title })}
            onDescriptionChange={(description) => updateDraft(draft.id, { description })}
            onAssigneeChange={(assigneeId) => updateDraft(draft.id, { assigneeId })}
            onStartDateChange={(startDate) => updateDraft(draft.id, { startDate })}
            onDueDateChange={(dueDate) => updateDraft(draft.id, { dueDate })}
            onReject={() => openRejectDialog(draft.id)}
          />
        ))}
      </ActionReviewGroup>

      <ActionReviewGroup confidence={AI_CONFIDENCE.NEEDS_REVIEW} count={needsReview.length}>
        {needsReview.map((draft) => (
          <ActionReviewRow
            key={draft.id}
            draft={draft}
            assigneeOptions={review.assigneeOptions}
            onTitleChange={(title) => updateDraft(draft.id, { title })}
            onDescriptionChange={(description) => updateDraft(draft.id, { description })}
            onAssigneeChange={(assigneeId) => updateDraft(draft.id, { assigneeId })}
            onStartDateChange={(startDate) => updateDraft(draft.id, { startDate })}
            onDueDateChange={(dueDate) => updateDraft(draft.id, { dueDate })}
            onReject={() => openRejectDialog(draft.id)}
          />
        ))}

        {isAddingManual ? (
          <ManualDraftForm
            assigneeOptions={review.assigneeOptions}
            defaultDueDate={needsReview[0]?.dueDate ?? highConfidence[0]?.dueDate ?? ""}
            onAdd={addManualDraft}
            onCancel={() => setIsAddingManual(false)}
          />
        ) : (
          <div className="border-border border-t px-7 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingManual(true)}
            >
              + 액션 직접 추가
            </Button>
          </div>
        )}
      </ActionReviewGroup>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={visibleDrafts.length === 0}
          className="bg-foreground text-background hover:bg-foreground/90"
          onClick={() => setConfirmOpen(true)}
        >
          액션 분배 확정
        </Button>
      </div>

      <RejectReasonDialog
        isOpen={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTargetId(null)}
        actionTitle={rejectTarget?.title ?? ""}
        reason={pendingReason}
        onReasonChange={setPendingReason}
        onConfirm={confirmReject}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="액션 분배를 확정할까요?"
        description={`총 ${visibleDrafts.length}건의 액션이 지금 화면에 보이는 담당자·일정 그대로 생성됩니다. 확정 뒤에는 이 화면을 다시 열 수 없습니다.`}
        confirmLabel="확정"
        isPending={isPending}
        pendingLabel="확정 중"
        onConfirm={handleConfirm}
      />
    </div>
  );
}
