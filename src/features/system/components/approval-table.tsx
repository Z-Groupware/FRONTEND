import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { PendingCompanyApproval } from "../types";

interface ApprovalTableProps {
  companies: PendingCompanyApproval[];
  buildDetailHref: (id: string) => string;
  /** 한 페이지 행 수 — 마지막 페이지처럼 행이 모자라도 이 개수만큼 높이를 잡아둔다 */
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
  name: "28%",
  representative: "16%",
  email: "28%",
  members: "14%",
  appliedAt: "14%",
} as const;

/**
 * 승인 대기 기업 표.
 *
 * ⚠️ 행 어디를 눌러도 상세로 들어간다 — 그렇다고 `tr`에 `onClick`을 달지 않는다.
 *    그러면 키보드·스크린리더로는 못 누른다(CLAUDE.md §a11y: 클릭은 button/a).
 *    대신 회사명 링크를 **행 전체 크기로 늘리는 "stretched link" 방식**을 쓴다 —
 *    포커스 가능한 진짜 `<a>`는 하나뿐이고, 그 히트 영역만 CSS로 행 전체를 덮는다.
 * ⚠️ **행 개수 자체를 페이지마다 똑같이 맞춘다** — 마지막 페이지처럼 행이 모자라면
 *    보이지 않는 채움 행(filler row)으로 `pageSize`개를 채운다. CSS `min-height` 계산값으로
 *    맞추는 방식은 행 수가 다르면(보더 개수 등) 브라우저 렌더링에서 1~2px 오차가 생길 수 있다 —
 *    실제 `<tr>` 개수를 항상 똑같이 만들면 이 오차 자체가 생길 여지가 없다.
 */
export function ApprovalTable({ companies, buildDetailHref, pageSize }: ApprovalTableProps) {
  if (companies.length === 0) {
    return (
      <div
        className="border-border bg-card flex flex-col items-center justify-center rounded-xl border p-10 text-center"
        style={{ height: HEADER_HEIGHT_PX + pageSize * ROW_HEIGHT_PX }}
      >
        <p className="text-muted-foreground text-sm">승인 대기 중인 기업이 없습니다</p>
      </div>
    );
  }

  const fillerCount = Math.max(0, pageSize - companies.length);

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <Table className="min-w-[720px] table-fixed text-xs">
          {/* 각 컬럼 폭을 %로 고정 — 회사명 길이가 페이지마다 달라져도 다른 컬럼이 밀리지 않는다(위 COLUMN_WIDTH 참고) */}
          <colgroup>
            <col style={{ width: COLUMN_WIDTH.name }} />
            <col style={{ width: COLUMN_WIDTH.representative }} />
            <col style={{ width: COLUMN_WIDTH.email }} />
            <col style={{ width: COLUMN_WIDTH.members }} />
            <col style={{ width: COLUMN_WIDTH.appliedAt }} />
          </colgroup>
          <TableHeader>
            <TableRow className={cn(HEADER_HEIGHT_CLASS, "hover:bg-transparent")}>
              <TableHead className="pl-4 text-xs">회사명</TableHead>
              <TableHead className="text-center text-xs">대표자</TableHead>
              <TableHead className="text-center text-xs">담당자 이메일</TableHead>
              <TableHead className="text-center text-xs">구성원</TableHead>
              <TableHead className="pr-4 text-center text-xs">신청일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              // relative — stretched link(아래 after:absolute)가 이 행 기준으로 덮인다
              <TableRow key={company.id} className={cn(ROW_HEIGHT_CLASS, "relative")}>
                <TableCell className="max-w-0 pl-4">
                  <Link
                    href={buildDetailHref(company.id)}
                    className="text-foreground focus-visible:ring-ring flex items-center gap-2 rounded after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="truncate" title={company.companyName}>
                      {company.companyName}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      승인 대기
                    </Badge>
                  </Link>
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
                  {company.appliedAt}
                </TableCell>
              </TableRow>
            ))}
            {/* 채움 행 — 보더 없이, 스크린리더에서도 안 읽힌다. 목적은 오직 <tr> 개수를 맞추는 것뿐 */}
            {Array.from({ length: fillerCount }, (_, index) => (
              <TableRow
                key={`filler-${index}`}
                aria-hidden
                className={cn(ROW_HEIGHT_CLASS, "border-transparent hover:bg-transparent")}
              >
                <TableCell className="pl-4" colSpan={5} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
