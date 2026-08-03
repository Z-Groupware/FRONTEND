import { ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

export default function SystemApprovalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="기업 가입 승인" icon={ClipboardCheck} />
      {children}
    </>
  );
}
