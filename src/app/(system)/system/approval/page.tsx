import type { Metadata } from "next";

import { ApprovalList } from "@/features/system/components/approval-list";
import { getPendingApprovals } from "@/features/system/server";

export const metadata: Metadata = {
  title: "기업 가입 승인",
};

const PAGE_SIZE = 10;

export default async function SystemApprovalPage() {
  const { items, page, totalPages, totalCount } = await getPendingApprovals(1, PAGE_SIZE);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7">
        <ApprovalList
          initialItems={items}
          initialPage={page}
          initialTotalPages={totalPages}
          initialTotalCount={totalCount}
          pageSize={PAGE_SIZE}
        />
      </div>
    </main>
  );
}
