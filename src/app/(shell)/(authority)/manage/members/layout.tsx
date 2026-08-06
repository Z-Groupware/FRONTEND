import { Users } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

/**
 * ⚠️ **머리에 [계정 발급]을 두지 않는다.** 목록 카드 안 오른쪽에 둔다 — 그 버튼은
 *    권한에 따라 사라지는데, 머리에 두면 사라졌을 때 제목 줄이 휑해진다.
 */
export default function ManageMembersLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="사원 관리" icon={Users} />
      {children}
    </>
  );
}
