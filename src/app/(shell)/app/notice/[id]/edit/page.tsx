import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateNoticeAction } from "@/features/notice/actions";
import { NoticeForm } from "@/features/notice/components/notice-form";
import { getNoticeById } from "@/features/notice/server";
import { getMockActor } from "@/lib/mock-actor";
import { canManageNotice } from "@/lib/permission";

export const metadata: Metadata = {
  title: "공지 수정",
};

interface AppNoticeEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AppNoticeEditPage({ params }: AppNoticeEditPageProps) {
  // 권한 없는 사람은 화면 자체를 숨긴다(404) — 서버 재검사는 액션에서도 한 번 더(§권한).
  if (!canManageNotice(getMockActor())) notFound();

  const { id } = await params;
  const notice = await getNoticeById(id);
  if (!notice) notFound();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <h2 className="text-foreground text-base font-semibold">공지 수정</h2>
        <div className="border-border bg-card rounded-xl border p-6">
          <NoticeForm
            action={updateNoticeAction}
            notice={notice}
            submitLabel="수정"
            cancelHref={`/app/notice/${notice.id}`}
          />
        </div>
      </div>
    </main>
  );
}
