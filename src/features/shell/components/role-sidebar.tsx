"use client";

import {
  Bell,
  Building2,
  Calendar,
  CreditCard,
  DoorOpen,
  FolderOpen,
  HardDrive,
  Kanban,
  LayoutGrid,
  type LucideIcon,
  Search,
  User,
  Users,
  UsersRound,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ZLogo } from "@/components/icons/z-logo";
import { ROLE_LABEL } from "@/constants/domain";
import type { AssignableRole } from "@/features/onboarding/types";
import { cn } from "@/lib/utils";

import type { NavIconName, NavItem, NavSection } from "../nav";

/** 이름 → 아이콘. 구성 파일은 서버에서 읽히므로 실제 컴포넌트는 여기서 붙인다. */
const NAV_ICON: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutGrid,
  project: FolderOpen,
  search: Search,
  calendar: Calendar,
  notice: Bell,
  meeting: Video,
  room: DoorOpen,
  board: Kanban,
  people: UsersRound,
  me: User,
  members: Users,
  billing: CreditCard,
  storage: HardDrive,
  setting: Building2,
};

interface RoleSidebarProps {
  sections: NavSection[];
  /** 하단 계정 줄 */
  user: { name: string; role: AssignableRole };
}

/**
 * 역할별 대시보드가 공유하는 사이드바.
 *
 * ⚠️ 레이아웃은 하나다 — 역할마다 `sections`만 갈아 끼운다(CLAUDE.md §라우트 그룹).
 */
export function RoleSidebar({ sections, user }: RoleSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-sidebar flex w-[220px] shrink-0 flex-col border-r">
      <div className="border-border flex h-[52px] shrink-0 items-center gap-[7px] border-b px-[14px]">
        <ZLogo className="text-foreground size-[18px]" title="Z" />
        <span className="text-[15px] leading-[22px] tracking-[-0.3px]">Z</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-[7px]">
        {sections.map((section, index) => (
          <div key={section.title ?? "primary"} className={index > 0 ? "pt-2.5" : undefined}>
            {section.title && (
              <>
                <div className="border-border/70 mx-[10.5px] border-t" />
                <p className="text-muted-foreground/80 px-[10.5px] pt-3.5 pb-[5.25px] text-[11px] leading-4 tracking-[0.275px]">
                  {section.title}
                </p>
              </>
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
          {user.name.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs leading-[18px]">{user.name}</span>
        <span className="bg-role-owner-surface text-role-owner shrink-0 rounded px-[5.25px] py-[1.75px] text-[9px] leading-[14px]">
          {ROLE_LABEL[user.role]}
        </span>
      </div>
    </aside>
  );
}

function SidebarItem({ item, isCurrent }: { item: NavItem; isCurrent: boolean }) {
  const Icon = NAV_ICON[item.icon];
  const inner = (
    <>
      <Icon className="size-[14px] shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[13px] leading-5">{item.label}</span>
      {item.badge !== undefined && (
        <span className="bg-foreground text-background flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full px-[3.5px] text-[10px] leading-none font-semibold tabular-nums">
          {item.badge}
        </span>
      )}
    </>
  );

  const shape = "flex h-[34px] items-center gap-[8.75px] rounded-md px-[10.5px] transition-colors";

  // ⚠️ 아직 없는 화면은 링크로 두지 않는다 — 누르면 404가 뜬다(§정직성)
  if (!item.isReady) {
    return (
      <span
        aria-disabled
        title="아직 만드는 중이에요"
        className={cn(shape, "text-muted-foreground/45 cursor-not-allowed")}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        shape,
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        isCurrent
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      {inner}
    </Link>
  );
}
