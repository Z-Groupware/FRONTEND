"use client";

import { Folder } from "lucide-react";
import { usePathname } from "next/navigation";

import { PageHeader } from "@/features/shell/components/page-header";

/** 목록 경로 — 이 경로면 뒤로가기 없음, 더 깊으면(생성·상세) 뒤로가기를 붙인다. */
const PROJECTS_LIST_PATH = "/app/projects";

/**
 * 프로젝트 화면 공통 상단바 — `usePathname`이 필요한 부분만 잎사귀로 분리했다.
 * ⚠️ 이 컴포넌트만 클라이언트다 — `ProjectsLayout` 자체는 서버 컴포넌트로 남겨
 *    도메인 전체가 클라이언트 경계가 되는 걸 막는다(CLAUDE.md §핵심 4원칙 1).
 */
export function ProjectsPageHeader() {
  const pathname = usePathname();
  const isDetail = pathname !== PROJECTS_LIST_PATH;

  return (
    <PageHeader
      title="프로젝트"
      icon={Folder}
      reserveBack
      backTo={isDetail ? { href: PROJECTS_LIST_PATH, label: "프로젝트" } : undefined}
    />
  );
}
