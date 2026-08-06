"use client";

import { Folder } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

/** 목록 경로 — 이 경로면 뒤로가기 없음, 더 깊으면(생성·상세) 뒤로가기를 붙인다. */
const PROJECTS_LIST_PATH = "/app/projects";

/**
 * 프로젝트 화면 공통 상단바 — 사이드바 "프로젝트" 탭과 같은 폴더 아이콘을 쓴다.
 * ⚠️ 상단바엔 어떤 버튼도 올리지 않는다(팀 규칙) — 생성 버튼은 페이지 본문 안에 둔다.
 * ⚠️ 목록·생성·상세를 각자 레이아웃으로 나누면 이동할 때 헤더가 통째로 다시 마운트돼
 *    뒤로가기 화살표가 튀어나오며 덜컥거린다(`NoticeLayout`과 같은 이유) — 헤더는 여기
 *    한 곳에서만 그리고, 경로만 보고 뒤로가기 유무를 바꾼다.
 */
export default function ProjectsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDetail = pathname !== PROJECTS_LIST_PATH;

  return (
    <>
      <PageHeader
        title="프로젝트"
        icon={Folder}
        reserveBack
        backTo={isDetail ? { href: PROJECTS_LIST_PATH, label: "프로젝트" } : undefined}
      />
      {children}
    </>
  );
}
