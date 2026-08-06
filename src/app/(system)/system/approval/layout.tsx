import type { ReactNode } from "react";

import { ApprovalHeader } from "@/features/system/components/approval-header";

export default function SystemApprovalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ApprovalHeader />
      {children}
    </>
  );
}
