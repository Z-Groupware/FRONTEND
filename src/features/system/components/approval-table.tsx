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
import { COMPANY_SIZE_LABEL } from "@/constants/domain";

import type { PendingCompanyApproval } from "../types";

interface ApprovalTableProps {
  companies: PendingCompanyApproval[];
  buildDetailHref: (id: string) => string;
}

/**
 * 승인 대기 기업 표.
 *
 * ⚠️ 행 어디를 눌러도 상세로 들어간다 — 그렇다고 `tr`에 `onClick`을 달지 않는다.
 *    그러면 키보드·스크린리더로는 못 누른다(CLAUDE.md §a11y: 클릭은 button/a).
 *    대신 회사명 링크를 **행 전체 크기로 늘리는 "stretched link" 방식**을 쓴다 —
 *    포커스 가능한 진짜 `<a>`는 하나뿐이고, 그 히트 영역만 CSS로 행 전체를 덮는다.
 */
export function ApprovalTable({ companies, buildDetailHref }: ApprovalTableProps) {
  if (companies.length === 0) {
    return (
      <div className="border-border bg-card rounded-xl border p-10 text-center">
        <p className="text-muted-foreground text-sm">승인 대기 중인 기업이 없어요</p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">회사명</TableHead>
            <TableHead>대표자</TableHead>
            <TableHead>담당자 이메일</TableHead>
            <TableHead>규모</TableHead>
            <TableHead className="pr-6">신청일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            // relative — stretched link(아래 after:absolute)가 이 행 기준으로 덮인다
            <TableRow key={company.id} className="relative">
              <TableCell className="py-4 pl-6">
                <Link
                  href={buildDetailHref(company.id)}
                  className="text-foreground focus-visible:ring-ring inline-flex items-center gap-2 rounded after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {company.companyName}
                  <Badge variant="secondary">승인 대기</Badge>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground py-4">
                {company.representativeName}
              </TableCell>
              <TableCell className="text-muted-foreground py-4">{company.contactEmail}</TableCell>
              <TableCell className="text-muted-foreground py-4">
                {COMPANY_SIZE_LABEL[company.size]}
              </TableCell>
              <TableCell className="text-muted-foreground py-4 pr-6 tabular-nums">
                {company.appliedAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
