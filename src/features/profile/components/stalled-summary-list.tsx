"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { retryMeetingSummaryAction } from "@/features/meeting/summary/actions";
import type { StalledSummaryInfo } from "@/features/meeting/summary/types";

interface StalledSummaryListProps {
  summaries: StalledSummaryInfo[];
}

/**
 * "요약이 중단된 회의" 그룹의 행들 — 실시간 진행 배너를 놓친 사람(브라우저를 닫았던
 * 경우 등)이 여기서 뒤늦게 발견하고 [다시 분석]을 요청한다(BE #177 대응).
 * ⚠️ `isStalled`로 문구만 가른다 — 재분석 흐름 자체는 서버 문제든 실제 실패든 같다.
 * ⚠️ 카드 틀·빈 상태는 `TaskGroupSection`이 맡는다 — 여기는 행만 그린다.
 */
export function StalledSummaryList({ summaries }: StalledSummaryListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRetry(meetingId: string) {
    setPendingId(meetingId);
    startTransition(async () => {
      await retryMeetingSummaryAction(meetingId);
      toast("재분석을 요청했습니다");
      setPendingId(null);
    });
  }

  return (
    <>
      {summaries.map((summary) => {
        const isRowPending = isPending && pendingId === summary.meetingId;
        return (
          <div
            key={summary.meetingId}
            className="border-border flex items-center justify-between gap-3 border-t px-7 py-4 first:border-t-0"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-[13px] leading-5 font-medium">{summary.meetingTitle}</p>
              <p className="text-muted-foreground text-[12px] leading-4">
                {summary.isStalled ? "AI 요약이 중단됐습니다" : "AI 요약에 실패했습니다"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              /*
                ⚠️ **행 하나가 아니라 전부 잠근다.** `pendingId`만 보고 잠그면 요청이 도는
                   동안 다른 행을 눌러 `pendingId`가 바뀌는 순간 첫 행의 버튼이 다시 풀려
                   같은 회의에 중복 요청을 보낼 수 있다(CodeRabbit 지적, 2026-08-09).
              */
              disabled={isPending}
              onClick={() => handleRetry(summary.meetingId)}
            >
              {isRowPending ? "요청 중" : "다시 분석"}
            </Button>
          </div>
        );
      })}
    </>
  );
}
