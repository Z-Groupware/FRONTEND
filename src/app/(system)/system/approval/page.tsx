import type { Metadata } from "next";

import { Pagination } from "@/components/common/pagination";
import { ApprovalDetailSheet } from "@/features/system/components/approval-detail-sheet";
import { ApprovalTable } from "@/features/system/components/approval-table";
import { getPendingApprovalById, getPendingApprovals } from "@/features/system/server";

export const metadata: Metadata = {
  title: "기업 가입 승인",
};

const PAGE_SIZE = 10;

interface SystemApprovalPageProps {
  searchParams: Promise<{ page?: string; id?: string }>;
}

function buildHref(page: number, id?: string): string {
  const query = new URLSearchParams();
  if (page > 1) query.set("page", String(page));
  if (id) query.set("id", id);
  const qs = query.toString();
  return qs ? `/system/approval?${qs}` : "/system/approval";
}

export default async function SystemApprovalPage({ searchParams }: SystemApprovalPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ items, totalPages }, selected] = await Promise.all([
    getPendingApprovals(page, PAGE_SIZE),
    params.id ? getPendingApprovalById(params.id) : Promise.resolve(null),
  ]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <ApprovalTable
          companies={items}
          buildDetailHref={(id) => buildHref(page, id)}
          pageSize={PAGE_SIZE}
        />
        <Pagination page={page} totalPages={totalPages} buildHref={(target) => buildHref(target)} />
      </div>

      <ApprovalDetailSheet company={selected} closeHref={buildHref(page)} />
    </main>
  );
}
