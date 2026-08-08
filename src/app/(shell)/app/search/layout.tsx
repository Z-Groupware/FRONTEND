import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="검색" icon={Search} meta="⌘K" />
      {children}
    </>
  );
}
