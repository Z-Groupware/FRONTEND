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
 * SYSTEM(서비스 운영자) 전용 사이드바.
 *
 * ⚠️ `RoleSidebar`와 구조는 비슷하지만 별도 컴포넌트다 — 헤더 표기("Z 운영자")와
 *    하단 계정 줄(역할 배지 없이 이메일만)이 달라서 그대로 재사용하면 SYSTEM 분기가
 *    RoleSidebar 안에 섞여 들어간다.
 */
export function SystemSidebar({ sections, account }: SystemSidebarProps) {
  const pathname = usePathname();

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

      <nav className="flex-1 overflow-y-auto p-[7px]">
        {sections.map((section, index) => (
          <div key={section.title ?? "primary"} className={index > 0 ? "pt-2.5" : undefined}>
            {section.title && (
              <p className="text-muted-foreground/80 px-[10.5px] pb-[5.25px] text-[11px] leading-4 tracking-[0.275px]">
                {section.title}
              </p>
            )}

            <ul className="flex flex-col gap-[1.75px]">
              {section.items.map((item) => (
                <li key={item.href}>
                  <SidebarItem item={item} isCurrent={pathname.startsWith(item.href)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-border flex h-[49px] shrink-0 items-center gap-[7px] border-t px-[17.5px]">
        <span className="bg-role-owner flex size-[21px] shrink-0 items-center justify-center rounded-full text-[10px] leading-none text-white">
          운
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-xs leading-[15px]">운영자 계정</p>
          <p className="text-muted-foreground truncate text-[11px] leading-[14px]">
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
      <Icon className="size-[14px] shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 translate-y-px truncate text-[13px] leading-5">
        {item.label}
      </span>
    </>
  );

  const shape = "flex h-[34px] items-center gap-[8.75px] rounded-md px-[10.5px] transition-colors";

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
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      {inner}
    </Link>
  );
}
