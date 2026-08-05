import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

/**
 * 프로젝트 화면 공통 상단바 — 제목만.
 * ⚠️ 상단바엔 어떤 버튼도 올리지 않는다(팀 규칙) — 생성 버튼은 페이지 본문 안에 둔다.
 * 사이드바에서 바로 닿는 화면이라 뒤로가기도 없다.
 */
export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="프로젝트" />
      {children}
    </>
  );
}
