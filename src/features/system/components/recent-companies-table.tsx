import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLAN, PLAN_LABEL } from "@/constants/domain";

import type { RecentCompany } from "../types";

/** "최근 가입 기업" 표. 비어있으면 안내 문구로 대체한다(CLAUDE.md §정직성 · loading/error/empty). */
export function RecentCompaniesTable({ companies }: { companies: RecentCompany[] }) {
  if (companies.length === 0) {
    return (
      <section className="border-border bg-card rounded-xl border p-6">
        <h2 className="text-foreground text-base font-semibold">최근 가입 기업</h2>
        <p className="text-muted-foreground mt-8 text-center text-sm">아직 가입한 기업이 없어요</p>
      </section>
    );
  }

  return (
    <section className="border-border bg-card overflow-hidden rounded-xl border">
      <h2 className="text-foreground px-6 pt-6 pb-4 text-base font-semibold">최근 가입 기업</h2>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">기업명</TableHead>
            <TableHead>플랜</TableHead>
            <TableHead>구성원</TableHead>
            <TableHead className="pr-6">가입일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="text-foreground pl-6">{company.name}</TableCell>
              <TableCell>
                <Badge variant={company.plan === PLAN.TEAM ? "default" : "secondary"}>
                  {PLAN_LABEL[company.plan]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {company.memberCount}명
              </TableCell>
              <TableCell className="text-muted-foreground pr-6 tabular-nums">
                {company.joinedAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
