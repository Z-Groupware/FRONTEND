import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createNoticeAction } from "@/features/notice/actions";
import { NoticeForm } from "@/features/notice/components/notice-form";
import { getMockActor } from "@/lib/mock-actor";
import { canManageNotice } from "@/lib/permission";

export const metadata: Metadata = {
  title: "새 공지",
};

export default function AppNoticeNewPage() {
  // 권한 없는 사람은 화면 자체를 숨긴다(404) — 서버 재검사는 액션에서도 한 번 더(§권한).
  if (!canManageNotice(getMockActor())) notFound();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <h2 className="text-foreground text-base font-semibold">새 공지</h2>
        <div className="border-border bg-card rounded-xl border p-6">
          <NoticeForm action={createNoticeAction} submitLabel="발행" cancelHref="/app/notice" />
        </div>
      </div>
    </main>
  );
}
