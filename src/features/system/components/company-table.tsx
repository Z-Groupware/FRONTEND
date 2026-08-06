import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COMPANY_STATUS_LABEL } from "@/constants/domain";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

import type { ManagedCompany } from "../types";
import { StatusBadge, type StatusTone } from "./status-badge";

interface CompanyTableProps {
  companies: ManagedCompany[];
  buildDetailHref: (id: string) => string;
  /** 한 페이지 행 수 — 마지막 페이지처럼 행이 모자라도 이 개수만큼 높이를 잡아둔다 */
  pageSize: number;
}

/** 행 하나의 높이 — `py-4`가 아니라 고정 클래스로 못박아 내용에 따라 늘어나지 않게 한다. */
const ROW_HEIGHT_CLASS = "h-[42px]";
const ROW_HEIGHT_PX = 42;
const HEADER_HEIGHT_CLASS = "h-[34px]";
const HEADER_HEIGHT_PX = 34;

const STATUS_TONE: Record<ManagedCompany["status"], StatusTone> = {
  ACTIVE: "positive",
  SUSPENDED: "negative",
  UNPAID: "warning",
};

/**
 * 컬럼 폭 — **%로 고정**한다(합 100). 픽셀 고정이면 화면 폭이 다른 환경(다른 PC·해상도)에서
 * 비율이 깨진다. `table-fixed` + `colgroup`과 짝을 이뤄야 실제로 적용된다 — `table-fixed` 없이는
 * 브라우저가 내용 길이를 보고 폭을 다시 계산해 버려 이 값이 무시된다.
 */
const COLUMN_WIDTH = {
  name: "26%",
  code: "22%",
  members: "12%",
  meetings: "14%",
  joinedAt: "16%",
  status: "10%",
} as const;

/**
 * 기업 관리 표.
 *
 * ⚠️ 행 어디를 눌러도 상세로 들어간다 — `tr`에 `onClick`을 달지 않고 "stretched link"
 *    방식을 쓴다(CLAUDE.md §a11y: 클릭은 button/a). `approval-table.tsx`와 같은 패턴이다.
 * ⚠️ **행 개수를 페이지마다 똑같이 맞춘다** — 부족한 만큼 보이지 않는 채움 행으로 채워
 *    페이지 전환 시 목록 높이가 들썩이지 않게 한다(`approval-table.tsx`에서 겪은 문제,
 *    같은 해법을 재사용한다).
 */
export function CompanyTable({ companies, buildDetailHref, pageSize }: CompanyTableProps) {
  if (companies.length === 0) {
    return (
      <div
        className="border-border bg-card flex flex-col items-center justify-center rounded-2xl border p-10 text-center"
        style={{ height: HEADER_HEIGHT_PX + pageSize * ROW_HEIGHT_PX }}
      >
        <p className="text-muted-foreground text-sm">조건에 맞는 기업이 없습니다</p>
      </div>
    );
  }

  const fillerCount = Math.max(0, pageSize - companies.length);

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <Table className="min-w-[760px] table-fixed text-xs">
          {/* 각 컬럼 폭을 %로 고정 — 기업명이 길어져도 다른 컬럼이 밀리지 않는다(위 COLUMN_WIDTH 참고) */}
          <colgroup>
            <col style={{ width: COLUMN_WIDTH.name }} />
            <col style={{ width: COLUMN_WIDTH.code }} />
            <col style={{ width: COLUMN_WIDTH.members }} />
            <col style={{ width: COLUMN_WIDTH.meetings }} />
            <col style={{ width: COLUMN_WIDTH.joinedAt }} />
            <col style={{ width: COLUMN_WIDTH.status }} />
          </colgroup>
          <TableHeader>
            <TableRow className={cn(HEADER_HEIGHT_CLASS, "bg-secondary/50 hover:bg-transparent")}>
              <TableHead className="pl-4 text-xs">기업명</TableHead>
              <TableHead className="text-center text-xs">기업 코드</TableHead>
              <TableHead className="text-center text-xs">구성원</TableHead>
              <TableHead className="text-center text-xs">이번달 회의</TableHead>
              <TableHead className="text-center text-xs">가입일</TableHead>
              <TableHead className="pr-4 text-center text-xs">상태</TableHead>
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
                    href={buildDetailHref(company.id)}
                    className="text-foreground focus-visible:ring-ring block truncate rounded after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                    title={company.name}
                  >
                    {company.name}
                  </Link>
                </TableCell>
                <TableCell
                  className="text-muted-foreground max-w-0 truncate text-center"
                  title={company.code}
                >
                  {company.code}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {company.memberCount}명
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {company.meetingCountThisMonth}회
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {formatDate(company.joinedAt)}
                </TableCell>
                <TableCell className="pr-4 text-center">
                  <StatusBadge tone={STATUS_TONE[company.status]}>
                    {COMPANY_STATUS_LABEL[company.status]}
                  </StatusBadge>
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
                <TableCell className="pl-4" colSpan={6} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
