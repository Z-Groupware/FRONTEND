import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { RecentCompany } from "../types";

const CARD_HEADER_CLASS =
  "flex items-center gap-2 px-7 pt-6 pb-3 text-[17px] leading-7 font-semibold tracking-[-0.3px]";

/**
 * "최근 가입 기업" 표. 비어있으면 안내 문구로 대체한다(CLAUDE.md §정직성 · loading/error/empty).
 *
 * ⚠️ 셀 규격을 **기준 화면과 같게** 맞춘다(DESIGN §3·§4) — 본문 13px, 이름 열 `px-6`,
 *    나머지 `px-4`. 한때 전부 12px에 `pl-4`라, 카드 제목(`px-7`)보다 표가 안쪽으로 들어가
 *    왼쪽 끝이 어긋나 보였다.
 */
export function RecentCompaniesTable({ companies }: { companies: RecentCompany[] }) {
  if (companies.length === 0) {
    // 크기는 develop의 개편(#74)을 따르고, 문구만 합니다체로 둔다(2026-08-04 카피 변경)
    return (
      <section className="border-border bg-card rounded-2xl border">
        <h2 className={CARD_HEADER_CLASS}>
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          최근 가입 기업
        </h2>
        <p className="text-muted-foreground px-7 pb-10 text-center text-[13px] leading-5">
          아직 가입한 기업이 없습니다
        </p>
      </section>
    );
  }

  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <h2 className={CARD_HEADER_CLASS}>
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        최근 가입 기업
      </h2>

      <div className="overflow-x-auto">
        <Table className="min-w-[520px] text-[13px]">
          <TableHeader>
            <TableRow className="text-muted-foreground bg-secondary/50 h-9 hover:bg-transparent">
              <TableHead className="text-muted-foreground px-6 text-[12px] font-normal">
                기업명
              </TableHead>
              <TableHead className="text-muted-foreground px-4 text-center text-[12px] font-normal">
                기업 코드
              </TableHead>
              <TableHead className="text-muted-foreground px-4 text-center text-[12px] font-normal">
                구성원
              </TableHead>
              <TableHead className="text-muted-foreground px-6 text-center text-[12px] font-normal">
                가입일
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} className="hover:bg-foreground/[0.04] h-12">
                <TableCell className="text-foreground px-6">{company.name}</TableCell>
                <TableCell
                  className="text-muted-foreground px-4 text-center font-mono"
                  title={company.code}
                >
                  {company.code}
                </TableCell>
                <TableCell className="text-muted-foreground px-4 text-center tabular-nums">
                  {company.memberCount}명
                </TableCell>
                {/* ⚠️ 관리자 화면 표기라 일반 화면의 "8월 5일(화)" 형식을 안 따른다(`types.ts`
                    `RecentCompany.joinedAt` 주석) — 원문 "YYYY-MM-DD" 그대로 보여준다. */}
                <TableCell className="text-muted-foreground px-6 text-center font-mono tabular-nums">
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
