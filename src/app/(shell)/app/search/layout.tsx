import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

interface SearchLayoutProps {
  children: ReactNode;
}

export default function SearchLayout({ children }: SearchLayoutProps) {
  return (
    <>
      <PageHeader title="검색" icon={Search} meta="⌘K" />
      {children}
    </>
  );
}
