import type { Metadata } from "next";

import { NoticeCreateDialog } from "@/features/notice/components/notice-create-dialog";
import { NoticeList } from "@/features/notice/components/notice-list";
import { getNotices } from "@/features/notice/server";
import { getMockActor } from "@/lib/mock-actor";
import { canManageNotice } from "@/lib/permission";

export const metadata: Metadata = {
  title: "공지",
};

export default async function AppNoticePage() {
  const notices = await getNotices();
  // 작성 권한이 있을 때만 "새 공지"를 보인다 — 서버 재검사는 createNoticeAction이 다시 한다(§권한).
  const canManage = canManageNotice(getMockActor());

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <NoticeList notices={notices} action={canManage ? <NoticeCreateDialog /> : null} />
      </div>
    </main>
  );
}
