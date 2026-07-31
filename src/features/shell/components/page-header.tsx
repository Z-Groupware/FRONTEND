import { ArrowLeft, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/common/theme-toggle";

interface PageHeaderProps {
  /** 화면 제목. 페이지마다 `h1`은 하나뿐이다(CLAUDE.md §SEO·a11y) */
  title: string;
  /** 제목 왼쪽 아이콘 — 화면 성격을 한눈에 알린다. 없으면 제목만 나온다 */
  icon?: LucideIcon;
  /** 오른쪽 끝 상태 한 줄 — 온보딩의 `단계 3 / 3`과 같은 자리다 */
  meta?: ReactNode;
  /**
   * 되돌아갈 곳. **사이드바에서 바로 닿는 화면에는 두지 않는다** —
   * 목록에서 상세로 들어가는 것처럼 한 단계 더 깊은 화면에서만 쓴다.
   */
  backTo?: { href: string; label: string };
  /** 오른쪽 액션 — 버튼 하나 또는 몇 개. 없으면 비워둔다 */
  action?: ReactNode;
}

/**
 * `(shell)` 아래 화면이 공유하는 상단바.
 *
 * **제목 왼쪽, 상태 오른쪽 끝.** 아이콘 상자·두 줄 설명·구분선은 두지 않는다 —
 * 머리가 본문보다 무거워지거나 시끄러워진다.
 *
 * ⚠️ **화면에서 부르지 않는다.** 도메인의 `layout.tsx`가 그린다 —
 *    화면마다 머리를 새로 그리면 높이·여백이 갈린다(사이드바와 같은 이유).
 * ⚠️ 탭은 여기에 넣지 않는다. 탭이 필요한 화면은 이 아래에 따로 둔다.
 */
export function PageHeader({ title, icon: Icon, meta, backTo, action }: PageHeaderProps) {
  return (
    <header className="border-border bg-card flex h-[64px] shrink-0 items-center gap-3 border-b px-8">
      {/* 화살표는 제목 왼쪽에 나란히 둔다 — 제목 위에 경로를 한 줄 더 쓰지 않는다 */}
      {backTo && (
        <Link
          href={backTo.href}
          aria-label={`${backTo.label}(으)로 돌아가기`}
          className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring -ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-[18px]" />
        </Link>
      )}

      {Icon && <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden />}

      {/* ⚠️ 한글 글리프가 줄 상자 안에서 위쪽에 앉는다 — 아이콘과 맞추려면 내려야 한다(팀 규칙) */}
      <h1 className="shrink-0 translate-y-[1.5px] truncate text-[22px] leading-[30px] font-semibold tracking-[-0.4px]">
        {title}
      </h1>

      {/* 남는 자리는 비워 둔다 — 선을 그으면 헤더가 시끄러워진다 */}
      <span className="flex-1" aria-hidden />

      {meta && (
        <span className="text-muted-foreground/70 shrink-0 pr-1 text-xs leading-[18px]">
          {meta}
        </span>
      )}

      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}

      {/* 테마 전환은 화면마다 두지 않고 여기 한 자리에 고정한다 — 다른 서비스들이 그렇듯 오른쪽 위 */}
      <ThemeToggle />
    </header>
  );
}
