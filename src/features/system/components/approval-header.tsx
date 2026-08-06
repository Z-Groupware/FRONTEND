"use client";

import { ClipboardCheck } from "lucide-react";
import { usePathname } from "next/navigation";

import { PageHeader } from "@/features/shell/components/page-header";

/** 목록 경로 — 이 경로면 뒤로가기 없음, 더 깊으면(상세) 뒤로가기를 붙인다(`notice-header.tsx`와 같은 패턴). */
const APPROVAL_LIST_PATH = "/system/approval";

/** 기업 승인 목록·상세가 함께 쓰는 상단바 — `usePathname`만 클라이언트가 필요해 이 잎사귀만 분리했다. */
export function ApprovalHeader() {
  const pathname = usePathname();
  const isDetail = pathname !== APPROVAL_LIST_PATH;

  return (
    <PageHeader
      title="기업 가입 승인"
      icon={ClipboardCheck}
      reserveBack
      backTo={isDetail ? { href: APPROVAL_LIST_PATH, label: "기업 가입 승인" } : undefined}
    />
  );
}
