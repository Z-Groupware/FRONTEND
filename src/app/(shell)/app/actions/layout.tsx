import { ListChecks } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

/**
 * 개인 액션 상세 전용 상단바.
 * ⚠️ 이 도메인엔 목록이 없다(프로젝트 타임라인·대시보드에서만 진입) — 그래서
 *    `backTo`를 두지 않는다. 어디로 돌아가야 할지는 본문의 브레드크럼이 안내한다.
 */
export default function ActionsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="액션" icon={ListChecks} />
      {children}
    </>
  );
}
