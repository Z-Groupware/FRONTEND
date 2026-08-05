import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { RecentCompany } from "../types";

/** "최근 가입 기업" 표. 비어있으면 안내 문구로 대체한다(CLAUDE.md §정직성 · loading/error/empty). */
export function RecentCompaniesTable({ companies }: { companies: RecentCompany[] }) {
  if (companies.length === 0) {
    // 크기는 develop의 개편(#74)을 따르고, 문구만 합니다체로 둔다(2026-08-04 카피 변경)
    return (
      <section className="border-border bg-card rounded-xl border p-5">
        <h2 className="text-foreground text-sm font-semibold">최근 가입 기업</h2>
        <p className="text-muted-foreground mt-6 text-center text-xs">
          아직 가입한 기업이 없습니다
        </p>
      </section>
    );
  }

  return (
    <section className="border-border bg-card overflow-hidden rounded-xl border">
      <h2 className="text-foreground px-5 pt-5 pb-3 text-sm font-semibold">최근 가입 기업</h2>

      <div className="overflow-x-auto">
        <Table className="min-w-[520px] text-xs">
          <TableHeader>
            <TableRow className="h-[34px] hover:bg-transparent">
              <TableHead className="pl-4 text-xs">기업명</TableHead>
              <TableHead className="text-center text-xs">기업 코드</TableHead>
              <TableHead className="text-center text-xs">구성원</TableHead>
              <TableHead className="pr-4 text-center text-xs">가입일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} className="h-[42px]">
                <TableCell className="text-foreground pl-4">{company.name}</TableCell>
                <TableCell
                  className="text-muted-foreground text-center font-mono"
                  title={company.code}
                >
                  {company.code}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {company.memberCount}명
                </TableCell>
                <TableCell className="text-muted-foreground pr-4 text-center tabular-nums">
                  {company.joinedAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
