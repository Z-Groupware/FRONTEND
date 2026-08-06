import type { Metadata } from "next";
import { Suspense } from "react";

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
        {/* ⚠️ `useSearchParams`(승인·반려 완료 토스트) 때문에 Suspense가 필요하다 — `companies/page.tsx`의 `CompanyFilterBar`와 같은 이유. */}
        <Suspense>
          <ApprovalList
            initialItems={items}
            initialPage={page}
            initialTotalPages={totalPages}
            initialTotalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </Suspense>
      </div>
    </main>
  );
}
