"use client";

import { CircleCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
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
  /*
    ⚠️ BE가 확정을 멈춘 상태(409 — 확인되지 않은 STT 구간 등). 실수가 아니라 **알고
       강행할지**를 사람이 정할 일이라, 버튼을 [그래도 확정]으로 바꿔 `force`로 다시 보낸다.
  */
  const [isBlocked, setIsBlocked] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleDrafts = drafts.filter((draft) => !(draft.id in rejectedReasons));
  const highConfidence = visibleDrafts.filter((d) => d.confidence === AI_CONFIDENCE.HIGH);
  const needsReview = visibleDrafts.filter((d) => d.confidence === AI_CONFIDENCE.NEEDS_REVIEW);
  /*
    ⚠️ **담당자 미정이 남아 있으면 확정을 잠근다.** AI가 담당자를 못 짚은 액션은 "담당자
       미정"으로 온다(매퍼 주석) — BE도 그 항목을 `NO_ASSIGNEE`로 걸러 분배하지 않으므로,
       여기서 안 잠그면 확정이 끝난 줄 알았는데 몇 건이 조용히 남는다(§정직성).
  */
  const hasUnassigned = visibleDrafts.some((draft) => draft.assigneeId === null);
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

  /**
   * 로컬에서 새로 만든 초안인가 — BE에서 온 초안은 id가 숫자 문자열이고, 이 화면에서
   * [액션 직접 추가]로 만든 것만 `manual-` 접두사를 갖는다(`nextManualDraftId`).
   * ⚠️ `isManual`로 가르면 안 된다 — 지난 확정 시도에서 서버에 이미 만들어진 수동 액션이
   *    재조회로 돌아오면 그것도 `isManual`이라, 같은 항목이 서버에 **한 번 더** 만들어진다.
   */
  function isLocalManual(id: string): boolean {
    return id.startsWith("manual-");
  }

  function handleConfirm(force: boolean) {
    setConfirmError(null);
    /* 처음 값과 대조해 **고친 칸만** 보낸다 — 안 고친 값까지 보내면 BE가 전부 "사람이
       고쳤다"로 라벨을 남겨 틀린 학습 재료가 된다(actions.ts 주석). */
    const initialById = new Map(review.drafts.map((draft) => [draft.id, draft]));

    startTransition(async () => {
      try {
        const result = await confirmActionDistributionAction(
          review.meetingId,
          {
            reviewed: visibleDrafts
              .filter((draft) => !isLocalManual(draft.id))
              .map((draft) => {
                const initial = initialById.get(draft.id);
                const changes = {
                  ...(initial && draft.title !== initial.title ? { title: draft.title } : {}),
                  ...(initial && draft.description !== initial.description
                    ? { description: draft.description }
                    : {}),
                  ...(initial &&
                  draft.assigneeId !== initial.assigneeId &&
                  draft.assigneeId !== null
                    ? { assigneeId: draft.assigneeId }
                    : {}),
                  ...(initial && draft.dueDate !== initial.dueDate
                    ? { dueDate: draft.dueDate }
                    : {}),
                };
                return {
                  id: draft.id,
                  ...(draft.startDate ? { plannedStartDate: draft.startDate } : {}),
                  ...(Object.keys(changes).length > 0 ? { changes } : {}),
                };
              }),
            /* 로컬에서만 만든 초안의 반려는 서버에 보낼 게 없다 — 만들지 않으면 그만이다 */
            rejected: Object.entries(rejectedReasons)
              .filter(([id]) => !isLocalManual(id))
              .map(([id, reason]) => ({ id, reason })),
            // ⚠️ 직접 추가한 항목은 `manuallyAdded`로 따로 보낸다 — 위에 넣으면 겹쳐 이중 집계된다.
            manuallyAdded: drafts
              .filter((draft) => isLocalManual(draft.id) && !(draft.id in rejectedReasons))
              .map((draft) => ({
                title: draft.title,
                description: draft.description,
                // 폼이 담당자 없이는 추가를 막는다(`canAdd`) — 여기 null이 올 수 없다
                assigneeId: draft.assigneeId ?? 0,
                startDate: draft.startDate,
                dueDate: draft.dueDate,
              })),
          },
          { force },
        );

        if (result.status === "notFound") {
          setConfirmError("회의를 찾을 수 없습니다. 페이지를 새로고침해 주세요.");
          return;
        }
        if (result.status === "failed") {
          setConfirmError(result.message);
          return;
        }
        /*
          ⚠️ BE가 멈춘 것(409)은 실패가 아니라 **경고**다 — 확인되지 않은 STT 구간이 남아
             액션이 빠졌을 수 있다는 뜻이라, 원인을 적고 [그래도 확정]으로만 넘어가게 한다.
        */
        if (result.status === "blocked") {
          setIsBlocked(true);
          setConfirmError(result.message);
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
          /* 반려 말고도 안 나간 게 있다 — 조용히 넘기면 검토가 끝난 줄 안다(§정직성) */
          if (result.skippedCount > 0) {
            toast.warning(`${result.skippedCount}건은 분배되지 않았습니다`);
          }
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
      <section className="border-border bg-card rounded-2xl border">
        <EmptyState
          icon={CircleCheck}
          title="액션 분배를 확정했습니다."
          description="이 화면은 다시 열 수 없습니다 — 확정 결과는 각 액션 상세에서 확인해 주세요."
        />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <ReviewLeaveGuard isBlocked />

      {/*
        ⚠️ **머리를 한 줄로 눕힌다**(2026-08-11). 제목·회의·안내를 세로로 쌓아 네 줄을 쓰다 보니
           정작 고쳐야 할 표가 화면 한참 아래에서 시작했다 — 왼쪽은 **무엇을 보는 화면인지**,
           오른쪽은 **어느 회의이고 무엇까지 고칠 수 있는지**로 나눠 한 층에 담는다.
        ⚠️ 오른쪽 글은 오른끝 정렬이다. 가운데로 두면 두 줄의 시작선이 어긋난다.
        ⚠️ 좁아지면 다시 세로로 쌓인다(`sm:`) — 그때는 원래대로 위아래로 읽는다.
      */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        {/* ⚠️ h1 아니다 — 셸 `PageHeader`(layout.tsx)가 이미 h1을 그린다(§한 페이지 h1 하나). */}
        <h2 className="text-[22px] leading-[30px] font-semibold tracking-[-0.4px]">
          AI가 처리한 액션 분배 결과가 나왔습니다!
        </h2>

        <div className="flex shrink-0 flex-col gap-1 sm:items-end">
          <p className="text-muted-foreground text-[13px] leading-5">
            {review.meetingTitle} · {review.scheduleLabel}
          </p>
          <p className="text-muted-foreground text-[12px] leading-4">
            두 그룹 모두 확정 전까지 내용·담당자·시작일·마감일을 수정할 수 있습니다.
          </p>
        </div>
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

      <div className="flex items-center justify-end gap-3">
        {/* 왜 잠겼는지 버튼 옆에서 말한다 — 눌리지 않는 버튼만 두면 고장으로 읽힌다(§정직성) */}
        {hasUnassigned && (
          <p className="text-muted-foreground text-[12px] leading-4">
            담당자 미정인 액션이 있습니다. 담당자를 지정해 주세요.
          </p>
        )}
        <Button
          type="button"
          disabled={visibleDrafts.length === 0 || hasUnassigned}
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
          if (!open) {
            setConfirmError(null);
            setIsBlocked(false);
          }
        }}
        title="액션 분배를 확정할까요?"
        description={
          <>
            총 {visibleDrafts.length}건의 액션이 지금 화면에 보이는 담당자·일정 그대로 생성됩니다.
            <br />
            확정 뒤에는 이 화면을 다시 열 수 없습니다.
          </>
        }
        confirmLabel={isBlocked ? "그래도 확정" : "확정"}
        isPending={isPending}
        pendingLabel="확정 중"
        error={confirmError}
        onConfirm={() => handleConfirm(isBlocked)}
      />
    </div>
  );
}
