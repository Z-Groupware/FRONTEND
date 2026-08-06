"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
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
 * ⚠️ 팀장 본인 신청은 중간 승인이 없다(WORKFLOW §7). **그런데 휴직과 오프보딩이 다르다** —
 *    휴직은 본인이 재할당까지 마치고 올라오지만, 오프보딩은 재할당 없이 "귀속 대기"로 남아
 *    새 팀장이 정해진 뒤 `/owner/leader-handovers`에서 일괄 이전된다. `midApproval`이 없다는
 *    것만 보고 한 문장을 쓰면, 승인자가 "재할당 끝났구나"로 읽고 승인해 아무도 안 맡은
 *    액션이 남는다(§정직성).
 * ⚠️ **승인도 반려도 확인 창을 거친다.** 승인하면 계정 상태가 바뀌고(오프보딩은 퇴사 처리라
 *    로그인이 막힌다), 반려하면 신청이 되돌아간다 — 둘 다 되돌릴 수 없다.
 *    반려는 사유를 적는 걸음이 하나 더 있다(사유 없이 되돌리면 무엇을 고칠지 모른다).
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
  /**
   * 지금 확인을 기다리는 일.
   * ⚠️ 승인도 반려도 **되돌릴 수 없다** — 승인하면 계정 상태가 바뀌고(오프보딩은 퇴사 처리),
   *    반려하면 신청이 되돌아간다. 둘 다 한 번 더 묻는다(§토스트: 파괴적 작업은 Dialog).
   */
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);
  const [isPending, startTransition] = useTransition();
  /*
    ⚠️ 폼을 열고 닫을 때 **포커스를 옮긴다.** 안 옮기면 사라진 버튼에 있던 포커스가 body로
       떨어져, 키보드 사용자는 다음 Tab이 어디로 갈지 알 수 없다(§a11y).
  */
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isRejecting) reasonRef.current?.focus();
  }, [isRejecting]);

  const isVacation = handover.type === HANDOVER_TYPE.VACATION;
  const typeLabel = HANDOVER_TYPE_LABEL[handover.type];

  const run = (task: () => Promise<{ isSuccess: boolean; message?: string }>, done: string) =>
    startTransition(async () => {
      const result = await task();
      if (!result.isSuccess) {
        toast.error(result.message ?? "처리하지 못했습니다");
        return;
      }
      setConfirming(null);
      setIsRejecting(false);
      setReason("");
      toast.success(done);
    });

  return (
    /*
      ⚠️ **면을 물들이지 않는다.** 색으로 알리는 건 에러뿐이고(§디자인 토큰), 카드 전체가
         노래지면 그 안의 글자 대비가 떨어진다 — 테두리와 배지만 경고 색을 쓴다.
    */
    <section className="border-warning/50 bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-center justify-between gap-3 px-7 pt-6 pb-5">
        <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          {typeLabel} 최종 승인 대기
        </h2>
        <span className="border-warning/40 text-warning shrink-0 rounded border px-2 py-0.5 text-[11px] leading-4">
          검토 필요
        </span>
      </div>

      <div className="flex flex-col gap-4 px-7 pb-6">
        {/* 신청 요약 — 유형·기간·건수 셋뿐이다 */}
        <dl className="border-border bg-secondary/40 divide-border divide-y rounded-lg border">
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
        <p className="border-border bg-secondary/40 text-muted-foreground rounded-lg border px-4 py-3 text-[13px] leading-5 break-keep">
          {handover.midApproval
            ? `${handover.midApproval.approverName} 리더가 ${formatMonthDayWeekday(handover.midApproval.approvedAt)} 중간 승인했습니다.`
            : isVacation
              ? "팀장 본인 신청이라 중간 승인 단계 없이 올라왔습니다. 재할당은 본인이 마쳤습니다."
              : "팀장 오프보딩이라 중간 승인 단계 없이 올라왔습니다. 승인 뒤 인수인계서를 새 팀장에게 귀속해야 합니다."}
        </p>

        {/*
          ⚠️ 팀장 오프보딩은 승인이 끝이 아니다 — 인수인계서를 새 팀장에게 귀속해야 완결된다
             (WORKFLOW §7). 갈 곳을 여기서 알려 준다.
        */}
        {!isVacation && !handover.midApproval && (
          <Link
            href="/owner/leader-handovers"
            className="text-muted-foreground hover:text-foreground text-[12px] leading-4 underline underline-offset-2"
          >
            팀장급 인수인계서 관리로 가기
          </Link>
        )}

        {isRejecting ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="reject-reason" className="sr-only">
              반려 사유
            </label>
            <textarea
              ref={reasonRef}
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="반려 사유를 입력해 주세요"
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
                  rejectRef.current?.focus();
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
                onClick={() => setConfirming("reject")}
              >
                반려 확정
              </Button>
            </div>
          </div>
        ) : (
          canApprove && (
            <div className="flex items-center justify-end gap-2">
              <Button
                ref={rejectRef}
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                disabled={isPending}
                onClick={() => setIsRejecting(true)}
              >
                반려
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ink"
                disabled={isPending}
                onClick={() => setConfirming("approve")}
              >
                {isPending ? "처리 중…" : "최종 승인"}
              </Button>
            </div>
          )
        )}
      </div>

      {/*
        ⚠️ 승인은 **계정 상태를 바꾼다.** 휴직이면 휴직으로, 오프보딩이면 퇴사 처리라
           계정이 닫힌다 — 무엇이 일어나는지 적고 한 번 더 받는다.
      */}
      <ConfirmDialog
        isOpen={confirming === "approve"}
        onOpenChange={() => setConfirming(null)}
        title={`${memberName} 님의 ${typeLabel}을 승인할까요?`}
        description={
          isVacation ? (
            <>
              {memberName} 님이 휴직 상태가 되고, 넘긴 액션 {handover.actionCount}건은 이미 재할당된
              대로 유지됩니다.
              <br />
              복귀해도 넘긴 액션은 되돌아오지 않습니다.
            </>
          ) : (
            <>
              {memberName} 님의 계정이 퇴사 처리되어 더는 로그인할 수 없습니다.
              <br />
              남긴 회의·액션 기록은 그대로 남습니다.
            </>
          )
        }
        confirmLabel="최종 승인"
        isPending={isPending}
        pendingLabel="승인 중…"
        onConfirm={() =>
          run(() => approveHandoverAction(memberId), `${typeLabel}을 최종 승인했습니다`)
        }
      />

      {/*
        ⚠️ 반려는 되돌릴 수 없다 — **무엇이 일어나는지** 적고 한 번 더 받는다.
           휴직과 오프보딩은 되돌아가는 자리가 같지만(재직), 신청한 사람이 다시 밟을 절차가
           달라서 유형을 문장에 적는다.
      */}
      <ConfirmDialog
        isOpen={confirming === "reject"}
        onOpenChange={() => setConfirming(null)}
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
