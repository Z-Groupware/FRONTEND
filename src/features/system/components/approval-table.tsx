import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

import type { PendingCompanyApproval } from "../types";
import { ApprovalRowActions } from "./approval-row-actions";

interface ApprovalTableProps {
  companies: PendingCompanyApproval[];
  /** 승인·반려가 끝나면 그 행을 지운다(무한 스크롤 로컬 상태) */
  onRowDone: (companyId: string) => void;
  /** 목록이 비었을 때 자리 높이를 잡는 데만 쓴다(첫 페이지 크기) */
  pageSize: number;
}

/** 행 하나의 높이 — `py-4`가 아니라 고정 클래스로 못박아 내용에 따라 늘어나지 않게 한다. */
const ROW_HEIGHT_CLASS = "h-[42px]";
const ROW_HEIGHT_PX = 42;
const HEADER_HEIGHT_CLASS = "h-[34px]";
const HEADER_HEIGHT_PX = 34;

/**
 * 컬럼 폭 — **%로 고정**한다(합 100). 픽셀 고정이면 화면 폭이 다른 환경에서 비율이 깨진다.
 * `table-fixed` + `colgroup`과 짝을 이뤄야 실제로 적용된다 — 없으면 브라우저가 셀 내용(회사명·
 * 이메일 길이)을 보고 폭을 다시 계산해 버려, 페이지를 넘길 때마다 회사명 길이에 따라 옆 컬럼이
 * 밀리는 덜컥거림이 생긴다(`company-table.tsx`에서 같은 문제를 같은 방식으로 고쳤다).
 */
const COLUMN_WIDTH = {
  name: "24%",
  representative: "16%",
  email: "26%",
  members: "12%",
  appliedAt: "12%",
  action: "10%",
} as const;

/**
 * 승인 대기 기업 표.
 *
 * ⚠️ 행을 눌러도 상세로 가지 않는다 — 옆에 뜨던 사이드 패널(`ApprovalDetailSheet`)은
 *    폐지했다(2026-08-06 팀 확정). 승인·반려는 행 안 버튼으로 그 자리에서 끝낸다.
 * ⚠️ 무한 스크롤 목록이라 채움 행(filler row)을 두지 않는다 — 페이지를 갈아 끼우던 방식과
 *    달리 항목이 아래로 이어붙기만 해서, 마지막 묶음이 `pageSize`보다 적어도 자연스럽다.
 */
export function ApprovalTable({ companies, onRowDone, pageSize }: ApprovalTableProps) {
  if (companies.length === 0) {
    return (
      <div
        className="border-border bg-card flex flex-col items-center justify-center rounded-2xl border p-10 text-center"
        style={{ height: HEADER_HEIGHT_PX + pageSize * ROW_HEIGHT_PX }}
      >
        <p className="text-muted-foreground text-sm">승인 대기 중인 기업이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <Table className="min-w-[760px] table-fixed text-xs">
          {/* 각 컬럼 폭을 %로 고정 — 회사명 길이가 페이지마다 달라져도 다른 컬럼이 밀리지 않는다(위 COLUMN_WIDTH 참고) */}
          <colgroup>
            <col style={{ width: COLUMN_WIDTH.name }} />
            <col style={{ width: COLUMN_WIDTH.representative }} />
            <col style={{ width: COLUMN_WIDTH.email }} />
            <col style={{ width: COLUMN_WIDTH.members }} />
            <col style={{ width: COLUMN_WIDTH.appliedAt }} />
            <col style={{ width: COLUMN_WIDTH.action }} />
          </colgroup>
          <TableHeader>
            <TableRow className={cn(HEADER_HEIGHT_CLASS, "bg-secondary/50 hover:bg-transparent")}>
              <TableHead className="pl-4 text-xs">회사명</TableHead>
              <TableHead className="text-center text-xs">대표자</TableHead>
              <TableHead className="text-center text-xs">담당자 이메일</TableHead>
              <TableHead className="text-center text-xs">구성원</TableHead>
              <TableHead className="text-center text-xs">신청일</TableHead>
              <TableHead className="pr-4 text-center text-xs">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow
                key={company.id}
                className={cn(ROW_HEIGHT_CLASS, "hover:bg-foreground/[0.04]")}
              >
                <TableCell className="max-w-0 pl-4">
                  <span className="text-foreground block truncate" title={company.companyName}>
                    {company.companyName}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-0 truncate text-center">
                  {company.representativeName}
                </TableCell>
                <TableCell
                  className="text-muted-foreground max-w-0 truncate text-center"
                  title={company.contactEmail}
                >
                  {company.contactEmail}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {company.memberCount}명
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {formatDate(company.appliedAt)}
                </TableCell>
                <TableCell className="pr-4 text-center">
                  <ApprovalRowActions
                    companyId={company.id}
                    companyName={company.companyName}
                    onDone={onRowDone}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
