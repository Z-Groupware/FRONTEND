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

/** 다음 수동 초안 id — updater 밖에서 생성한다(React가 updater를 두 번 부를 수 있어, 안에서 세면 어긋난다). */
function nextManualDraftId(): string {
  return `manual-${crypto.randomUUID()}`;
}

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
  /*
    ⚠️ **제목은 베껴 두고 열림 깃발만 내린다**(2026-08-10). 전에는 제목을 `rejectTargetId`에서
       그때그때 찾아 썼는데, 닫을 때 id가 먼저 비어서 **닫힘 애니메이션이 도는 동안**
       창에 `''이 확정 대상에서 제외됩니다`가 스쳤다 — 방금 보던 제목이 빈 따옴표로 바뀐다.
       창이 아직 화면에 있는 동안에는 마지막에 보던 값이 그대로 있어야 한다
       (기업 상세 확인창이 같은 이유로 쓰는 방식 — `system/company-detail-dialog.tsx`).
  */
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectTitle, setRejectTitle] = useState("");
  const [pendingReason, setPendingReason] = useState<ActionRejectReason | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleDrafts = drafts.filter((draft) => !(draft.id in rejectedReasons));
  const highConfidence = visibleDrafts.filter((d) => d.confidence === AI_CONFIDENCE.HIGH);
  const needsReview = visibleDrafts.filter((d) => d.confidence === AI_CONFIDENCE.NEEDS_REVIEW);
  function updateDraft(id: string, patch: Partial<AiActionDraft>) {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  function openRejectDialog(id: string) {
    setRejectTargetId(id);
    setRejectTitle(drafts.find((d) => d.id === id)?.title ?? "");
    setPendingReason(null);
    setIsRejectOpen(true);
  }

  function confirmReject() {
    if (!rejectTargetId || !pendingReason) return;
    setRejectedReasons((prev) => ({ ...prev, [rejectTargetId]: pendingReason }));
    setIsRejectOpen(false);
  }

  function addManualDraft(input: ManualDraftInput) {
    const id = nextManualDraftId();
    setDrafts((prev) => [
      ...prev,
      {
        id,
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
    setConfirmError(null);
    startTransition(async () => {
      try {
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

        if (result.status === "notFound") {
          setConfirmError("회의를 찾을 수 없습니다. 페이지를 새로고침해 주세요.");
          return;
        }
        // "alreadyConfirmed"도 결과적으로 확정된 상태다 — 다른 탭에서 먼저 확정한 경우까지 포함.
        setConfirmOpen(false);
        setIsConfirmed(true);
        /*
          ⚠️ 둘은 **다른 일**이다 — 내가 방금 확정한 것과, 다른 탭에서 이미 확정돼 있던 것.
             앞은 성공(체크)이고 뒤는 알림이라 아이콘 없이 둔다. 뒤를 성공으로 띄우면
             내가 분배한 것처럼 읽힌다(§정직성).
        */
        if (result.status === "confirmed") {
          toast.success(`${result.createdCount}건의 액션을 분배했습니다`);
        } else {
          toast("이미 확정된 회의입니다");
        }
      } catch {
        // ⚠️ 다이얼로그를 열어 둔 채 원인을 적는다 — 토스트만 띄우면 몇 초 뒤엔 실패했던 사실이
        //    사라져 사용자가 같은 버튼을 다시 누른다(§confirm-dialog "토스트는 보조다").
        setConfirmError("액션 분배에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
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
        {/* ⚠️ h1 아니다 — 셸 `PageHeader`(layout.tsx)가 이미 h1을 그린다(§한 페이지 h1 하나). */}
        <h2 className="text-[22px] leading-[30px] font-semibold tracking-[-0.4px]">
          AI가 처리한 액션 분배 결과가 나왔습니다!
        </h2>
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
        isOpen={isRejectOpen}
        onOpenChange={(open) => !open && setIsRejectOpen(false)}
        actionTitle={rejectTitle}
        reason={pendingReason}
        onReasonChange={setPendingReason}
        onConfirm={confirmReject}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmError(null);
        }}
        title="액션 분배를 확정할까요?"
        description={
          <>
            총 {visibleDrafts.length}건의 액션이 지금 화면에 보이는 담당자·일정 그대로 생성됩니다.
            <br />
            확정 뒤에는 이 화면을 다시 열 수 없습니다.
          </>
        }
        confirmLabel="확정"
        isPending={isPending}
        pendingLabel="확정 중"
        error={confirmError}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
