"use client";

import { useMemo, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DatePickerField } from "@/components/common/date-picker-field";
import { ResultDialog } from "@/components/common/result-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUTHORITY, HANDOVER_TYPE } from "@/constants/domain";
import { pickPaletteColor } from "@/lib/palette";

import { submitHandoverAction } from "../actions";
import { sortActionsForVacation } from "../lib";
import type { HandoverContext } from "../types";
import { HandoverActionListCard } from "./handover-action-list-card";

interface VacationFormProps {
  context: HandoverContext;
}

/**
 * 휴직 신청 — 시작일·종료일 + 인계할 액션 선택.
 * ⚠️ **팀장 본인 휴직만 다르다**(WORKFLOW.md §7 "팀장 본인 휴직"): 위에 상위 리더가
 *    없어 본인이 신청과 재할당을 동시에 한다. [다음]으로 2단계(팀원 배정)를 거친 뒤에야
 *    [인수인계서 신청]이 뜬다. 일반 팀원은 1단계에서 바로 신청한다.
 */
export function VacationForm({ context }: VacationFormProps) {
  const { applicant, actions, teammates } = context;
  const isLeader = applicant.role === AUTHORITY.LEADER;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [assignments, setAssignments] = useState<Record<number, number>>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { sorted, inRangeIds } = useMemo(
    () => sortActionsForVacation(actions, startDate, endDate),
    [actions, startDate, endDate],
  );

  /*
    ⚠️ `useMemo`로 참조를 고정한다. 매 렌더 새 객체를 넘기면 base-ui `Select`의 내부 이펙트가
       참조 변화 → store 갱신 → 리렌더 → 새 객체를... 반복해 "Maximum update depth exceeded"로
       이어진다(CI에서 실제로 터졌다 — `search-filter-bar.tsx`와 같은 이유).
  */
  const teammateItems = useMemo(
    () =>
      Object.fromEntries(
        teammates.map((teammate) => [teammate.id, `${teammate.name} ${teammate.position}`]),
      ),
    [teammates],
  );

  function handleDateChange(next: { startDate?: string; endDate?: string }) {
    setStartDate(next.startDate ?? startDate);
    setEndDate(next.endDate ?? endDate);
  }

  function toggleAction(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedActions = sorted.filter((action) => selectedIds.has(action.id));
  const canProceed = Boolean(startDate) && Boolean(endDate) && selectedActions.length > 0;
  const canAssignSubmit = selectedActions.every((action) => assignments[action.id]);

  function handleConfirm() {
    setConfirmError(null);
    startTransition(async () => {
      try {
        await submitHandoverAction({
          type: HANDOVER_TYPE.VACATION,
          startDate,
          endDate,
          actionIds: selectedActions.map((action) => action.id),
          assignments: isLeader ? assignments : {},
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
      {step === 1 && (
        <>
          <section className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-7">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vacation-start">
                  휴직 시작 날짜 <span className="text-destructive">*</span>
                </Label>
                <DatePickerField
                  id="vacation-start"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(next) => handleDateChange({ startDate: next })}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vacation-end">
                  휴직 종료 날짜 <span className="text-destructive">*</span>
                </Label>
                <DatePickerField
                  id="vacation-end"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(next) => handleDateChange({ endDate: next })}
                  className="w-full"
                />
              </div>
            </div>
          </section>

          <HandoverActionListCard
            actions={sorted}
            selectedIds={selectedIds}
            highlightedIds={inRangeIds}
            onToggle={toggleAction}
          />

          <div className="flex justify-end">
            {isLeader ? (
              <Button
                type="button"
                disabled={!canProceed}
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => setStep(2)}
              >
                다음
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!canProceed}
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => setConfirmOpen(true)}
              >
                인수인계서 신청
              </Button>
            )}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <section className="border-border bg-card flex flex-col rounded-2xl border">
            <div className="px-7 pt-6 pb-3">
              <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
                <span className="bg-foreground size-2 rounded-full" aria-hidden />
                선택한 액션에 담당자를 지정해 주세요
              </h2>
              <p className="text-muted-foreground mt-1 text-[12px] leading-4">
                본인 개인 액션이라 팀원에게 바로 나눠 줄 수 있어요. 부담되는 액션은 1단계로 돌아가
                선택을 해제해 주세요.
              </p>
            </div>
            <ul className="border-border border-t">
              {selectedActions.map((action) => {
                const tagColor = pickPaletteColor(action.projectTag);
                return (
                  <li
                    key={action.id}
                    className="border-border flex items-center gap-3 border-b px-7 py-3 last:border-b-0"
                  >
                    <span
                      className="w-fit shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                      style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
                    >
                      {action.projectTag}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
                      {action.title}
                    </span>
                    <Select
                      // ⚠️ `items`를 넘긴다 — 안 넘기면 트리거가 닫혀 있는 동안은 라벨을 못 찾아
                      //    원문 값(`teammate.id`)이 그대로 보인다(`search-filter-bar.tsx`와 같은 이유).
                      items={teammateItems}
                      value={
                        assignments[action.id] !== undefined ? String(assignments[action.id]) : ""
                      }
                      onValueChange={(value) =>
                        setAssignments((prev) => ({ ...prev, [action.id]: Number(value) }))
                      }
                    >
                      <SelectTrigger aria-label={`${action.title} 담당자 선택`} className="w-40">
                        <SelectValue placeholder="담당자 선택" />
                      </SelectTrigger>
                      <SelectContent side="bottom" alignItemWithTrigger={false}>
                        {teammates.map((teammate) => (
                          <SelectItem key={teammate.id} value={String(teammate.id)}>
                            {teammate.name} {teammate.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              이전
            </Button>
            <Button
              type="button"
              disabled={!canAssignSubmit}
              className="bg-foreground text-background hover:bg-foreground/90"
              onClick={() => setConfirmOpen(true)}
            >
              인수인계서 신청
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmError(null);
        }}
        title="인수인계서를 신청할까요?"
        description={
          isLeader
            ? `선택한 액션 ${selectedActions.length}건이 지정한 팀원에게 바로 배정되고, 오너의 최종 승인 대기로 올라갑니다.`
            : `선택한 액션 ${selectedActions.length}건과 함께 팀장에게 인수인계서가 올라갑니다.`
        }
        confirmLabel="신청"
        isPending={isPending}
        pendingLabel="신청 중"
        error={confirmError}
        onConfirm={handleConfirm}
      />

      <ResultDialog
        isOpen={resultOpen}
        onOpenChange={setResultOpen}
        title="인수인계서를 신청했습니다."
        description={
          isLeader ? "오너의 최종 승인을 기다려 주세요." : "팀장의 승인을 기다려 주세요."
        }
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
