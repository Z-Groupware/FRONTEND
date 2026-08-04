"use client";

import {
  Bell,
  CalendarDays,
  CalendarRange,
  Columns3,
  CreditCard,
  Folder,
  HardDrive,
  LayoutDashboard,
  type LucideIcon,
  Search,
  Settings,
  UserRound,
  UserRoundCheck,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { ZLogo } from "@/components/icons/z-logo";
import { ROLE_LABEL } from "@/constants/domain";
import { cn } from "@/lib/utils";

import { roleHome } from "../home";
import type { NavIconName, NavItem, NavSection } from "../nav";
import type { Viewer } from "../viewer";

/**
 * 이름 → 아이콘. 구성 파일은 서버에서 읽히므로 실제 컴포넌트는 여기서 붙인다.
 * OWNER_NAV가 쓰는 이름만 채운다 — `Partial`이라 나머지(SYSTEM 전용 등)는 없어도 된다.
 */
const NAV_ICON: Partial<Record<NavIconName, LucideIcon>> = {
  dashboard: LayoutDashboard,
  project: Folder,
  search: Search,
  calendar: CalendarDays,
  notice: Bell,
  meeting: Video,
  room: CalendarRange,
  board: Columns3,
  people: Users,
  me: UserRound,
  members: UserRoundCheck,
  billing: CreditCard,
  storage: HardDrive,
  setting: Settings,
};

interface RoleSidebarProps {
  sections: NavSection[];
  /** 하단 계정 줄 */
  /**
   * 지금 보고 있는 사람 — 이름·역할 배지·로고 링크가 이 값에서 나온다.
   *
   * ⚠️ `isAdmin`까지 통째로 받는다. 네비 구성은 역할 하나로 못 정한다 —
   *    `/manage`는 Admin 겸직자에게만 보이므로 `role` + `isAdmin`을 같이 본다
   *    (DECISIONS §(role)).
   */
  user: Viewer;
}

/**
 * 지금 경로와 **가장 길게 일치하는 href 하나**를 고른다.
 *
 * ⚠️ 단순 `pathname.startsWith(item.href)`는 안 된다 — `/billing`(구독·결제)이
 *    `/billing/checkout`(결제)의 접두사라서 결제 화면에서 두 곳이 같이 켜진다.
 *    후보 중 가장 구체적인(긴) href만 켜지게 골라야 한 곳만 켜진다.
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
 * 역할별 대시보드가 공유하는 사이드바.
 *
 * ⚠️ 레이아웃은 하나다 — 역할마다 `sections`만 갈아 끼운다(CLAUDE.md §라우트 그룹).
 */
export function RoleSidebar({ sections, user }: RoleSidebarProps) {
  const pathname = usePathname();
  const activeHref = findActiveHref(sections, pathname);

  return (
    /*
      ⚠️ 배경은 `--background`다 — 라이트에서 **흰색**, 다크에서 **검정**에 가깝다.
         상단바도 같은 토큰을 쓴다. 껍데기끼리 색이 갈리면 화면이 조각나 보인다.
         본문은 같은 색이지만 **점 그리드**가 깔려 구분된다.
    */
    <aside className="border-border bg-background flex w-[220px] shrink-0 flex-col border-r">
      {/*
        로고만 둔다 — 옆에 "Z" 글자를 또 쓰면 같은 말이 두 번이다.
        상단바(64px)와 높이를 맞춰 사이드바와 본문의 첫 줄이 한 선에 놓이게 한다.
      */}
      {/* 로고 아래 선을 두지 않는다 — 사이드바 안에서 또 나누면 조각나 보인다 */}
      <div className="flex h-[56px] shrink-0 items-center px-[18px]">
        <Link
          href={roleHome(user.role)}
          aria-label="Z 홈으로"
          className="focus-visible:ring-ring rounded transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:outline-hidden"
        >
          <ZLogo className="text-foreground size-[22px]" title="Z" />
        </Link>
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
                  <SidebarItem item={item} isCurrent={item.href === activeHref} />
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
  const Icon = NAV_ICON[item.icon] ?? LayoutDashboard;
  const inner = (
    <>
      <Icon className="size-[14px] shrink-0" aria-hidden />
      {/* 한글 글자가 상자 안에서 위쪽에 앉아 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
      <span className="min-w-0 flex-1 translate-y-px truncate text-[13px] leading-5">
        {item.label}
      </span>
      {item.badge !== undefined && (
        <span className="bg-foreground text-background flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full px-[3.5px] text-[10px] leading-none font-semibold tabular-nums">
          {item.badge}
        </span>
      )}
    </>
  );

  const shape = "flex h-[34px] items-center gap-[8.75px] rounded-md px-[10.5px] transition-colors";

  /*
    ⚠️ 아직 없는 화면은 링크로 두지 않는다 — 누르면 404가 뜬다.
       대신 **색은 다른 메뉴와 똑같이** 둔다. 흐리게 처리하면 완성된 화면을 볼 때
       사이드바가 절반쯤 죽은 것처럼 보인다.
       누르면 조용히 아무 일도 안 일어나는 대신 준비 중이라고 알린다(§정직성).
  */
  if (!item.isReady) {
    return (
      <button
        type="button"
        aria-disabled
        // ⚠️ 토스트는 한 줄(220px)이라 짧게 쓴다 — 길면 잘린다(`sonner.tsx`)
        onClick={() => toast(`${item.label}은 준비 중입니다`)}
        // 색은 준비된 메뉴와 똑같이 — 평소 회색, 호버하면 글자가 진해진다
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
