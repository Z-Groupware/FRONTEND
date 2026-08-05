import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/shell/components/page-header";
import { getViewer } from "@/features/shell/viewer";
import { canCreateProject } from "@/lib/permission";
import { cn } from "@/lib/utils";

/**
 * 프로젝트 화면 공통 상단바. `새 프로젝트`는 **Owner만**(생성 권한).
 * ⚠️ 버튼 숨김은 UX일 뿐이다 — 실제 생성은 Server Action에서 `canCreateProject`로 다시 본다.
 * 사이드바에서 바로 닿는 화면이라 뒤로가기는 두지 않는다.
 */
export default async function ProjectsLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();

  return (
    <>
      <PageHeader
        title="프로젝트"
        action={
          canCreateProject(viewer) ? (
            <Link href="/app/projects/new" className={cn(buttonVariants({ variant: "ink" }))}>
              <Plus />새 프로젝트
            </Link>
          ) : undefined
        }
      />
      {children}
    </>
  );
}
