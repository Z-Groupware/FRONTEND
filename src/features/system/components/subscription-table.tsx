"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAYMENT_STATUS, PAYMENT_STATUS_LABEL, PLAN } from "@/constants/domain";
import { cn } from "@/lib/utils";

import { formatWon } from "../format";
import type { SubscriptionRecord } from "../types";
import { NoticeMailDialog } from "./notice-mail-dialog";

interface SubscriptionTableProps {
  subscriptions: SubscriptionRecord[];
}

/** 행 하나의 높이 — 고정 클래스로 못박아 내용에 따라 늘어나지 않게 한다(`company-table.tsx`와 같은 이유). */
const ROW_HEIGHT_CLASS = "h-13"; // 52px
const HEADER_HEIGHT_CLASS = "h-[41px]";

const STATUS_BADGE_VARIANT: Record<SubscriptionRecord["paymentStatus"], "default" | "secondary"> = {
  PAID: "default",
  UNPAID: "secondary",
  CANCELED: "secondary",
};

/**
 * 컬럼 폭 — **%로 고정**한다(합 100). `table-fixed` + `colgroup`과 짝을 이뤄야 실제로 적용된다 —
 * 기업 관리·기업 승인 표에서 겪은 "페이지 전환 시 열 밀림"과 같은 문제를 처음부터 막는다.
 */
const COLUMN_WIDTH = {
  company: "26%",
  plan: "12%",
  members: "10%",
  amount: "16%",
  billingDate: "14%",
  status: "10%",
  action: "12%",
} as const;

/**
 * 구독·매출 목록 — 항상 5건(미납 우선 + 최신 가입순)만 보여준다(서버에서 이미 잘라 넘겨준다).
 *
 * ⚠️ "안내 발송" 버튼은 **미납 상태에서만** 뜬다 — 완료·해지 건에는 보낼 안내가 없다.
 * ⚠️ 버튼을 누르면 바로 보내지 않고 **확인 Dialog**를 먼저 띄운다 — 메일 발송은 되돌릴 수
 *    없는 조작이라 토스트만으로 확인받지 않는다(CLAUDE.md §토스트: 파괴적 작업은 Dialog).
 */
export function SubscriptionTable({ subscriptions }: SubscriptionTableProps) {
  const [noticeTarget, setNoticeTarget] = useState<{
    companyId: string;
    companyName: string;
    ownerEmail: string;
  } | null>(null);

  if (subscriptions.length === 0) {
    return (
      <div className="border-border bg-card flex items-center justify-center rounded-xl border p-10 text-center">
        <p className="text-muted-foreground text-sm">구독 중인 기업이 없어요</p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <Table className="table-fixed">
        {/* 각 컬럼 폭을 %로 고정 — 기업명 길이가 달라져도 다른 컬럼이 밀리지 않는다(위 COLUMN_WIDTH 참고) */}
        <colgroup>
          <col style={{ width: COLUMN_WIDTH.company }} />
          <col style={{ width: COLUMN_WIDTH.plan }} />
          <col style={{ width: COLUMN_WIDTH.members }} />
          <col style={{ width: COLUMN_WIDTH.amount }} />
          <col style={{ width: COLUMN_WIDTH.billingDate }} />
          <col style={{ width: COLUMN_WIDTH.status }} />
          <col style={{ width: COLUMN_WIDTH.action }} />
        </colgroup>
        <TableHeader>
          <TableRow className={cn(HEADER_HEIGHT_CLASS, "hover:bg-transparent")}>
            <TableHead className="pl-6">기업명</TableHead>
            <TableHead>플랜</TableHead>
            <TableHead>인원</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>결제일</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="pr-6">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.companyId} className={ROW_HEIGHT_CLASS}>
              <TableCell className="max-w-0 truncate pl-6" title={subscription.companyName}>
                {subscription.companyName}
              </TableCell>
              <TableCell>
                <Badge variant={subscription.plan === PLAN.TEAM ? "default" : "secondary"}>
                  {subscription.plan === PLAN.TEAM ? "Team" : "Free"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {subscription.memberCount}명
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatWon(subscription.amount)}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {subscription.billingDate ?? "–"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE_VARIANT[subscription.paymentStatus]}>
                  {PAYMENT_STATUS_LABEL[subscription.paymentStatus]}
                </Badge>
              </TableCell>
              <TableCell className="pr-6">
                {subscription.paymentStatus === PAYMENT_STATUS.UNPAID && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
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

      <NoticeMailDialog target={noticeTarget} onClose={() => setNoticeTarget(null)} />
    </div>
  );
}
