import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 상세는 **목록으로 돌아가는 길**을 머리에 둔다.
 *
 * ⚠️ `PageHeader`를 쓰지 않는다 — 그건 제목이 화면 이름인 자리이고, 여기 제목은
 *    사람 이름이라 프로필 카드가 `h1`으로 이미 말한다(§a11y: `h1`은 하나다).
 */
export default function ManageMemberDetailLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-border flex h-14 shrink-0 items-center gap-1.5 border-b px-8">
        <Link
          href="/manage/members"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-1 rounded text-[13px] leading-5 focus-visible:ring-2 focus-visible:outline-hidden"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          사원 관리
        </Link>
      </div>
      {children}
    </>
  );
}
