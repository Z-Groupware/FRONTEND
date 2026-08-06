"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { HANDOVER_TYPE, HANDOVER_TYPE_LABEL } from "@/constants/handover";
import { formatMonthDayWeekday } from "@/lib/date";

import { approveHandoverAction, rejectHandoverAction } from "../manage-actions";
import type { PendingHandover } from "../manage-types";

/**
 * 최종 승인 카드 — 인수인계의 **마지막 관문**.
 *
 * ⚠️ **인수인계 내용을 보여주지 않는다.** 중간 단계에서 이미 끝나 올라온 것이라 대표가
 *    실무 내용을 다시 볼 이유가 없다(WORKFLOW §7 "실무 내용 직접 볼 필요 없음").
 *    여기 적는 건 유형·기간·건수와 **누가 언제 중간 승인했는지**뿐이다.
 * ⚠️ 팀장 본인 신청은 중간 승인이 없다 — 본인이 재할당까지 마쳐 곧바로 올라온다(WORKFLOW §7).
 *    그때는 다른 문장을 쓴다.
 * ⚠️ **반려는 두 걸음이다.** 사유를 적고 [반려 확정]을 누르면 확인 창이 먼저 뜨고, 거기서
 *    확인해야 요청이 나간다 — 되돌릴 수 없는 일이라 그렇다(§토스트: 파괴적 작업은 Dialog).
 */
export function HandoverApprovalCard({
  memberId,
  memberName,
  handover,
  canApprove,
}: {
  memberId: number;
  memberName: string;
  handover: PendingHandover;
  /** OWNER만 참이다 — Admin 겸직자는 화면엔 들어와도 이 버튼이 없다(WORKFLOW §11) */
  canApprove: boolean;
}) {
  /** 반려 사유를 적는 중인가 */
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  /** 사유를 다 적고 확인을 기다리는 중인가 */
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isVacation = handover.type === HANDOVER_TYPE.VACATION;
  const typeLabel = HANDOVER_TYPE_LABEL[handover.type];

  const run = (task: () => Promise<{ isSuccess: boolean; message?: string }>, done: string) =>
    startTransition(async () => {
      const result = await task();
      if (!result.isSuccess) {
        toast.error(result.message ?? "처리하지 못했습니다");
        return;
      }
      setIsConfirming(false);
      setIsRejecting(false);
      setReason("");
      toast.success(done);
    });

  return (
    <section className="border-warning/40 bg-warning/5 overflow-hidden rounded-2xl border">
      <div className="flex items-center justify-between gap-3 px-7 pt-6 pb-5">
        <h2 className="text-[15px] leading-6 font-semibold tracking-[-0.2px]">
          {typeLabel} 최종 승인 대기
        </h2>
        <span className="border-warning/40 text-warning shrink-0 rounded border px-2 py-0.5 text-[11px] leading-4">
          검토 필요
        </span>
      </div>

      <div className="flex flex-col gap-4 px-7 pb-6">
        {/* 신청 요약 — 유형·기간·건수 셋뿐이다 */}
        <dl className="border-border bg-card divide-border divide-y rounded-lg border">
          <div className="flex items-baseline gap-4 px-4 py-2.5">
            <dt className="text-muted-foreground w-20 shrink-0 text-[12px] leading-5">유형</dt>
            <dd className="text-[13px] leading-5">{typeLabel}</dd>
          </div>
          {/* ⚠️ 오프보딩은 기간이 없다 — 돌아오지 않는다. 빈 줄을 두면 값이 빠진 것처럼 읽힌다 */}
          {handover.period && (
            <div className="flex items-baseline gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground w-20 shrink-0 text-[12px] leading-5">기간</dt>
              <dd className="text-[13px] leading-5">
                <time dateTime={handover.period.from}>
                  {formatMonthDayWeekday(handover.period.from)}
                </time>
                {" ~ "}
                <time dateTime={handover.period.to}>
                  {formatMonthDayWeekday(handover.period.to)}
                </time>
              </dd>
            </div>
          )}
          <div className="flex items-baseline gap-4 px-4 py-2.5">
            <dt className="text-muted-foreground w-20 shrink-0 text-[12px] leading-5">인계 액션</dt>
            <dd className="text-[13px] leading-5 tabular-nums">{handover.actionCount}건</dd>
          </div>
        </dl>

        {/*
          ⚠️ 중간 승인 여부만 적는다. 팀장 본인 신청이면 중간 단계가 없어 `null`이고,
             그때 "중간 승인이 없다"가 아니라 **왜 없는지**를 적어야 빠뜨린 것처럼 안 읽힌다.
        */}
        <p className="border-border bg-card text-muted-foreground rounded-lg border px-4 py-3 text-[13px] leading-5 break-keep">
          {handover.midApproval
            ? `${handover.midApproval.approverName} 리더가 ${formatMonthDayWeekday(handover.midApproval.approvedAt)} 중간 승인했습니다.`
            : "팀장 본인 신청이라 중간 승인 단계 없이 올라왔습니다. 재할당은 본인이 마쳤습니다."}
        </p>

        {isRejecting ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="reject-reason" className="sr-only">
              반려 사유
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="반려 사유를 입력하세요..."
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 bg-card w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] leading-5 transition-colors outline-none focus-visible:ring-3"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setIsRejecting(false);
                  setReason("");
                }}
              >
                취소
              </Button>
              {/* ⚠️ 사유 없이는 안 열린다 — 되돌려받는 사람이 무엇을 고칠지 알아야 한다 */}
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending || reason.trim().length === 0}
                onClick={() => setIsConfirming(true)}
              >
                반려 확정
              </Button>
            </div>
          </div>
        ) : (
          canApprove && (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                disabled={isPending}
                onClick={() => setIsRejecting(true)}
              >
                반려 (사유)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ink"
                disabled={isPending}
                onClick={() =>
                  run(() => approveHandoverAction(memberId), `${typeLabel}을 최종 승인했습니다`)
                }
              >
                {isPending ? "처리 중…" : "최종 승인"}
              </Button>
            </div>
          )
        )}
      </div>

      {/*
        ⚠️ 반려는 되돌릴 수 없다 — **무엇이 일어나는지** 적고 한 번 더 받는다.
           휴직과 오프보딩은 되돌아가는 자리가 같지만(재직), 신청한 사람이 다시 밟을 절차가
           달라서 유형을 문장에 적는다.
      */}
      <ConfirmDialog
        isOpen={isConfirming}
        onOpenChange={() => setIsConfirming(false)}
        title={`${memberName} 님의 ${typeLabel} 신청을 반려할까요?`}
        description={
          <>
            신청이 되돌아가고 {memberName} 님은 다시 재직 상태가 됩니다.
            <br />
            {isVacation
              ? "다시 신청하려면 인수인계부터 새로 밟아야 합니다."
              : "이미 넘긴 액션은 되돌아오지 않습니다."}
          </>
        }
        confirmLabel="반려"
        isDestructive
        mark="alert"
        isPending={isPending}
        pendingLabel="반려 중…"
        onConfirm={() =>
          run(() => rejectHandoverAction(memberId, reason), `${typeLabel} 신청을 반려했습니다`)
        }
      />
    </section>
  );
}
