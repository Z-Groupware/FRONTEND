import type { Metadata } from "next";

import { NoticeComposeCard } from "@/features/system/components/notice-compose-card";
import { NoticeHistoryCard } from "@/features/system/components/notice-history-card";
import { getNoticeHistory, getNoticeTargetCompanies } from "@/features/system/server";

export const metadata: Metadata = {
  title: "공지 관리",
};

export default async function SystemNoticePage() {
  const [history, companies] = await Promise.all([getNoticeHistory(), getNoticeTargetCompanies()]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4">
        <NoticeComposeCard companies={companies} />
        <NoticeHistoryCard items={history} />
      </div>
    </main>
  );
}
