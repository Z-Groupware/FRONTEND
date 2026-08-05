import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoticeDetail } from "@/features/notice/components/notice-detail";
import { getNoticeById } from "@/features/notice/server";
import { getMockActor } from "@/lib/mock-actor";
import { canManageNotice } from "@/lib/permission";

interface AppNoticeDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AppNoticeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const notice = await getNoticeById(id);
  return { title: notice?.title ?? "공지" };
}

export default async function AppNoticeDetailPage({ params }: AppNoticeDetailPageProps) {
  const { id } = await params;
  const notice = await getNoticeById(id);

  // 없는 공지 id로 들어오면 404 — 링크로 닿는 화면이라 조용히 빈 화면을 보이지 않는다(§정직성).
  if (!notice) notFound();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-[1440px]">
        <NoticeDetail notice={notice} canManage={canManageNotice(getMockActor())} />
      </div>
    </main>
  );
}
