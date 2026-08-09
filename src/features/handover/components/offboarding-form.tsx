"use client";

import { useMemo, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ResultDialog } from "@/components/common/result-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HANDOVER_TYPE } from "@/constants/domain";

import { submitHandoverAction } from "../actions";
import type { HandoverContext } from "../types";
import { HandoverActionListCard } from "./handover-action-list-card";

const DESCRIPTION_MAX_LENGTH = 1000;

interface OffboardingFormProps {
  context: HandoverContext;
}

/**
 * 오프보딩 신청 — 전체 액션 자동 선택(해제 불가) + 인수인계 상세 설명(WORKFLOW.md §7).
 * ⚠️ 팀장 오프보딩도 신청 화면 자체는 똑같다 — 다른 건 신청 뒤 라우팅(바로 오너에게)뿐이고
 *    그건 승인 화면(`/team/handover`·`/owner/leader-handovers`, 별도 이슈) 쪽 일이다.
 */
export function OffboardingForm({ context }: OffboardingFormProps) {
  const { actions } = context;
  const selectedIds = useMemo(() => new Set(actions.map((action) => action.id)), [actions]);

  const [description, setDescription] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canSubmit = description.trim().length > 0 && actions.length > 0;

  function handleConfirm() {
    setConfirmError(null);
    startTransition(async () => {
      try {
        await submitHandoverAction({
          type: HANDOVER_TYPE.OFFBOARDING,
          description: description.trim(),
          actionIds: actions.map((action) => action.id),
        });
        setConfirmOpen(false);
        setResultOpen(true);
      } catch {
        setConfirmError("인수인계서 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="border-border bg-card flex flex-col gap-1.5 rounded-2xl border p-7">
        <Label htmlFor="offboarding-description">
          담당 업무 및 인수인계 상세 설명 <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="offboarding-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
          placeholder="담당했던 업무, 진행 맥락, 인수받을 사람이 알아야 할 사항을 작성해 주세요. PDF에도 함께 포함됩니다."
          maxLength={DESCRIPTION_MAX_LENGTH}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3"
        />
        <p className="text-muted-foreground text-right text-xs tabular-nums">
          {description.length}/{DESCRIPTION_MAX_LENGTH}
        </p>
      </section>

      <HandoverActionListCard actions={actions} selectedIds={selectedIds} locked />

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!canSubmit}
          className="bg-foreground text-background hover:bg-foreground/90"
          onClick={() => setConfirmOpen(true)}
        >
          인수인계서 신청
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmError(null);
        }}
        title="인수인계서를 신청할까요?"
        description={`담당 액션 ${actions.length}건 전체가 인수인계서에 담겨 신청됩니다. 신청 뒤에는 이 화면에서 되돌릴 수 없습니다.`}
        confirmLabel="신청"
        isDestructive
        isPending={isPending}
        pendingLabel="신청 중"
        error={confirmError}
        onConfirm={handleConfirm}
      />

      <ResultDialog
        isOpen={resultOpen}
        onOpenChange={setResultOpen}
        title="인수인계서를 신청했습니다."
        description="담당자 승인을 기다려 주세요."
        action={
          <Button
            type="button"
            className="bg-foreground text-background hover:bg-foreground/90 w-full"
            onClick={() => setResultOpen(false)}
          >
            확인
          </Button>
        }
      />
    </div>
  );
}
