import type { Metadata } from "next";

import { NoticeList } from "@/features/notice/components/notice-list";
import { getNotices } from "@/features/notice/server";

export const metadata: Metadata = {
  title: "공지",
};

export default async function AppNoticePage() {
  const notices = await getNotices();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <p className="text-muted-foreground text-sm">업무에 필요한 공지를 확인하세요.</p>
        <NoticeList notices={notices} />
      </div>
    </main>
  );
}
