"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAYMENT_STATUS, PAYMENT_STATUS_LABEL } from "@/constants/domain";
import { cn } from "@/lib/utils";

import { sendUnpaidNoticeAction } from "../actions";
import { formatWon } from "../format";
import type { SubscriptionRecord } from "../types";
import { NoticeMailDialog } from "./notice-mail-dialog";
import { StatusBadge, type StatusTone } from "./status-badge";

interface SubscriptionTableProps {
  subscriptions: SubscriptionRecord[];
}

/** 행 하나의 높이 — 고정 클래스로 못박아 내용에 따라 늘어나지 않게 한다(`company-table.tsx`와 같은 이유). */
const ROW_HEIGHT_CLASS = "h-[42px]";
const HEADER_HEIGHT_CLASS = "h-[34px]";

const STATUS_TONE: Record<SubscriptionRecord["paymentStatus"], StatusTone> = {
  PAID: "positive",
  UNPAID: "warning",
  CANCELED: "neutral",
};

/**
 * 컬럼 폭 — **%로 고정**한다(합 100). `table-fixed` + `colgroup`과 짝을 이뤄야 실제로 적용된다 —
 * 기업 관리·기업 승인 표에서 겪은 "페이지 전환 시 열 밀림"과 같은 문제를 처음부터 막는다.
 */
const COLUMN_WIDTH = {
  company: "30%",
  members: "12%",
  amount: "18%",
  billingDate: "18%",
  status: "10%",
  action: "12%",
} as const;

/**
 * 구독·매출 목록 — 항상 5건(미납 우선 + 최신 가입순)만 보여준다(서버에서 이미 잘라 넘겨준다).
 *
 * ⚠️ "안내 발송" 버튼은 **미납 상태에서만** 뜬다 — 완료·해지 건에는 보낼 안내가 없다.
 * ⚠️ 버튼을 누르면 **확인 Dialog**를 먼저 띄운다 — 메일 발송은 되돌릴 수 없는 조작이라
 *    토스트만으로 확인받지 않는다(CLAUDE.md §토스트: 파괴적 작업은 Dialog). "예"를 누른
 *    뒤 발송 결과는 토스트로 알린다(§토스트: 변경 결과 피드백).
 */
export function SubscriptionTable({ subscriptions }: SubscriptionTableProps) {
  const [isPending, startTransition] = useTransition();
  const [noticeTarget, setNoticeTarget] = useState<{
    companyId: string;
    companyName: string;
    ownerEmail: string;
  } | null>(null);

  const handleConfirm = (companyId: string) => {
    const target = noticeTarget;
    if (!target) return;

    startTransition(async () => {
      const response = await sendUnpaidNoticeAction(companyId);
      if (response.success) {
        toast(`${target.companyName} 담당자에게 안내 메일을 발송했어요`);
      } else {
        toast(`${target.companyName} 정보를 찾을 수 없어 발송하지 못했어요`);
      }
      setNoticeTarget(null);
    });
  };

  if (subscriptions.length === 0) {
    return (
      <div className="border-border bg-card flex items-center justify-center rounded-xl border p-10 text-center">
        <p className="text-muted-foreground text-sm">구독 중인 기업이 없어요</p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <Table className="min-w-[680px] table-fixed text-xs">
          {/* 각 컬럼 폭을 %로 고정 — 기업명 길이가 달라져도 다른 컬럼이 밀리지 않는다(위 COLUMN_WIDTH 참고) */}
          <colgroup>
            <col style={{ width: COLUMN_WIDTH.company }} />
            <col style={{ width: COLUMN_WIDTH.members }} />
            <col style={{ width: COLUMN_WIDTH.amount }} />
            <col style={{ width: COLUMN_WIDTH.billingDate }} />
            <col style={{ width: COLUMN_WIDTH.status }} />
            <col style={{ width: COLUMN_WIDTH.action }} />
          </colgroup>
          <TableHeader>
            <TableRow className={cn(HEADER_HEIGHT_CLASS, "hover:bg-transparent")}>
              <TableHead className="pl-4 text-xs">기업명</TableHead>
              <TableHead className="text-center text-xs">인원</TableHead>
              <TableHead className="text-center text-xs">금액</TableHead>
              <TableHead className="text-center text-xs">결제일</TableHead>
              <TableHead className="text-center text-xs">상태</TableHead>
              <TableHead className="pr-4 text-center text-xs">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.companyId} className={ROW_HEIGHT_CLASS}>
                <TableCell className="max-w-0 truncate pl-4" title={subscription.companyName}>
                  {subscription.companyName}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {subscription.memberCount}명
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {formatWon(subscription.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {subscription.billingDate ?? "–"}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge tone={STATUS_TONE[subscription.paymentStatus]}>
                    {PAYMENT_STATUS_LABEL[subscription.paymentStatus]}
                  </StatusBadge>
                </TableCell>
                <TableCell className="pr-4 text-center">
                  {subscription.paymentStatus === PAYMENT_STATUS.UNPAID && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() =>
                        setNoticeTarget({
                          companyId: subscription.companyId,
                          companyName: subscription.companyName,
                          ownerEmail: subscription.ownerEmail,
                        })
                      }
                    >
                      안내 발송
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <NoticeMailDialog
        target={noticeTarget}
        onCancel={() => setNoticeTarget(null)}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </div>
  );
}
