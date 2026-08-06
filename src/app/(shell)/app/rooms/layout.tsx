import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

interface RoomsLayoutProps {
  children: ReactNode;
}

/** 사이드바에서 바로 닿는 화면이라 뒤로가기를 두지 않는다(`calendar`·`notice` 목록과 같은 규칙). */
export default function RoomsLayout({ children }: RoomsLayoutProps) {
  return (
    <>
      <PageHeader title="회의실" />
      {children}
    </>
  );
}
