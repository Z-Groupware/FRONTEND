"use client";

import { Video } from "lucide-react";
import { usePathname } from "next/navigation";

import { PageHeader } from "@/features/shell/components/page-header";

const MEETING_LIST_PATH = "/app/meeting";

/**
 * 회의 목록·상세가 함께 쓰는 상단바 — 공지(`NoticeHeader`)와 같은 패턴이다.
 * 목록·상세를 각자 레이아웃으로 나누면 이동 때 헤더가 통째로 다시 마운트돼 덜컥거린다.
 * ⚠️ 아이콘은 사이드바의 `meeting` 아이콘과 같은 `Video`다 — 다르면 같은 화면이 두 얼굴이 된다.
 */
export function MeetingHeader() {
  const pathname = usePathname();
  const isDetail = pathname !== MEETING_LIST_PATH;

  return (
    <PageHeader
      title="회의"
      icon={Video}
      backTo={isDetail ? { href: MEETING_LIST_PATH, label: "회의" } : undefined}
    />
  );
}
