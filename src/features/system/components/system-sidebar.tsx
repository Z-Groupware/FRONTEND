"use client";

import {
  Activity,
  Bell,
  Building2,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { ZLogo } from "@/components/icons/z-logo";
import type { NavIconName, NavItem, NavSection } from "@/features/shell/nav";
import { cn } from "@/lib/utils";

/**
 * 이름 → 아이콘. 구성 파일은 서버에서 읽히므로 실제 컴포넌트는 여기서 붙인다.
 * SYSTEM_NAV가 쓰는 이름만 채운다 — `Partial`이라 나머지는 fallback 아이콘으로 대체된다.
 */
const NAV_ICON: Partial<Record<NavIconName, LucideIcon>> = {
  dashboard: LayoutDashboard,
  approval: ClipboardCheck,
  company: Building2,
  billing: CreditCard,
  monitor: Activity,
  notice: Bell,
};

interface SystemSidebarProps {
  sections: NavSection[];
  /** 하단 계정 줄 */
  account: { email: string };
}

/**
 * 지금 경로와 **가장 길게 일치하는 href 하나**를 고른다.
 *
 * ⚠️ 단순 `pathname.startsWith(item.href)`는 안 된다 — `/system`(대시보드)이
 *    `/system/approval`(기업 승인)의 접두사라서 승인 화면에서 대시보드까지
 *    같이 켜진다. 후보 중 가장 구체적인(긴) href만 켜지게 골라야 한 곳만 켜진다.
 */
function findActiveHref(sections: NavSection[], pathname: string): string | undefined {
  let best: string | undefined;

  for (const section of sections) {
    for (const item of section.items) {
      const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (matches && (!best || item.href.length > best.length)) best = item.href;
    }
  }

  return best;
}

/**
 * SYSTEM(서비스 운영자) 전용 사이드바.
 *
 * ⚠️ `RoleSidebar`와 구조는 비슷하지만 별도 컴포넌트다 — 헤더 표기("Z 운영자")와
 *    하단 계정 줄(역할 배지 없이 이메일만)이 달라서 그대로 재사용하면 SYSTEM 분기가
 *    RoleSidebar 안에 섞여 들어간다.
 */
export function SystemSidebar({ sections, account }: SystemSidebarProps) {
  const pathname = usePathname();
  const activeHref = findActiveHref(sections, pathname);

  return (
    <aside className="border-border bg-background flex w-[220px] shrink-0 flex-col border-r">
      <div className="flex h-[64px] shrink-0 items-center gap-2 px-[18px]">
        <Link
          href="/system"
          aria-label="Z 운영자 홈으로"
          className="focus-visible:ring-ring flex items-center gap-2 rounded transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:outline-hidden"
        >
          <ZLogo className="text-foreground size-[22px]" title="Z" />
          <span className="text-foreground text-sm leading-none font-semibold">운영자</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-1.5">
        {sections.map((section, index) => (
          <div key={section.title ?? "primary"} className={index > 0 ? "pt-2" : undefined}>
            {section.title && (
              <p className="text-muted-foreground/80 px-2 pb-1 text-[10px] leading-4 tracking-[0.275px]">
                {section.title}
              </p>
            )}

            <ul className="flex flex-col gap-[1.5px]">
              {section.items.map((item) => (
                <li key={item.href}>
                  <SidebarItem item={item} isCurrent={item.href === activeHref} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-border flex h-11 shrink-0 items-center gap-1.5 border-t px-4">
        <span className="bg-role-owner flex size-[19px] shrink-0 items-center justify-center rounded-full text-[9px] leading-none text-white">
          운
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-[11px] leading-[14px]">운영자 계정</p>
          <p className="text-muted-foreground truncate text-[10px] leading-[13px]">
            {account.email}
          </p>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ item, isCurrent }: { item: NavItem; isCurrent: boolean }) {
  const Icon = NAV_ICON[item.icon] ?? LayoutDashboard;
  const inner = (
    <>
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 translate-y-px truncate text-xs leading-5">{item.label}</span>
    </>
  );

  const shape = "flex h-7 items-center gap-2 rounded-md px-2 transition-colors";

  // ⚠️ 아직 없는 화면은 링크로 두지 않는다 — 누르면 404가 뜬다(CLAUDE.md §정직성).
  if (!item.isReady) {
    return (
      <button
        type="button"
        aria-disabled
        onClick={() => toast(`${item.label} 화면은 아직 만드는 중이에요`)}
        className={cn(
          shape,
          "text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring w-full text-left focus-visible:ring-2 focus-visible:outline-hidden",
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        shape,
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-hidden",
        isCurrent
          ? "bg-foreground/10 text-foreground font-medium"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      {inner}
    </Link>
  );
}
