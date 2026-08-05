import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { NoticeList } from "@/features/notice/components/notice-list";
import { getNotices } from "@/features/notice/server";
import { getMockActor } from "@/lib/mock-actor";
import { canManageNotice } from "@/lib/permission";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "공지",
};

export default async function AppNoticePage() {
  const notices = await getNotices();
  // 작성 권한이 있을 때만 "새 공지"를 보인다 — 서버 재검사는 createNoticeAction이 다시 한다(§권한).
  const canManage = canManageNotice(getMockActor());

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">업무에 필요한 공지를 확인하세요.</p>
          {canManage && (
            <Link
              href="/app/notice/new"
              // 시안의 주 버튼은 액센트(파랑)가 아니라 먹색이다 — `department-setup.tsx`와 같은 이유.
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              <Plus aria-hidden />새 공지
            </Link>
          )}
        </div>

        <NoticeList notices={notices} />
      </div>
    </main>
  );
}
