import Link from "next/link";

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

import { TABLE_HEAD_ROW_CLASS } from "../table-style";
import type { PendingCompanyApproval } from "../types";

interface ApprovalTableProps {
  companies: PendingCompanyApproval[];
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
  name: "20%",
  businessRegistrationNumber: "14%",
  representative: "14%",
  email: "22%",
  members: "12%",
  appliedAt: "18%",
} as const;

/**
 * 승인 대기 기업 표.
 *
 * ⚠️ 행을 누르면 상세 페이지(`/system/approval/:id`)로 간다 — 승인·반려 버튼은 거기 있다
 *    (2026-08-06 팀 확정, `company-table.tsx`와 같은 stretched-link 패턴).
 * ⚠️ 무한 스크롤 목록이라 채움 행(filler row)을 두지 않는다 — 페이지를 갈아 끼우던 방식과
 *    달리 항목이 아래로 이어붙기만 해서, 마지막 묶음이 `pageSize`보다 적어도 자연스럽다.
 */
export function ApprovalTable({ companies, pageSize }: ApprovalTableProps) {
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
            <col style={{ width: COLUMN_WIDTH.businessRegistrationNumber }} />
            <col style={{ width: COLUMN_WIDTH.representative }} />
            <col style={{ width: COLUMN_WIDTH.email }} />
            <col style={{ width: COLUMN_WIDTH.members }} />
            <col style={{ width: COLUMN_WIDTH.appliedAt }} />
          </colgroup>
          <TableHeader>
            <TableRow className={cn(HEADER_HEIGHT_CLASS, TABLE_HEAD_ROW_CLASS)}>
              <TableHead className="pl-4 text-xs">회사명</TableHead>
              <TableHead className="text-center text-xs">사업자 번호</TableHead>
              <TableHead className="text-center text-xs">대표자</TableHead>
              <TableHead className="text-center text-xs">담당자 이메일</TableHead>
              <TableHead className="text-center text-xs">구성원</TableHead>
              <TableHead className="pr-4 text-center text-xs">신청일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              // relative — stretched link(아래 after:absolute)가 이 행 기준으로 덮인다
              <TableRow
                key={company.id}
                className={cn(ROW_HEIGHT_CLASS, "hover:bg-foreground/[0.04] relative")}
              >
                <TableCell className="max-w-0 pl-4">
                  <Link
                    href={`/system/approval/${company.id}`}
                    className="text-foreground focus-visible:ring-ring block truncate rounded after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                    title={company.companyName}
                  >
                    {company.companyName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-center font-mono tabular-nums">
                  {company.businessRegistrationNumber}
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
                <TableCell className="text-muted-foreground pr-4 text-center tabular-nums">
                  {formatDate(company.appliedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
