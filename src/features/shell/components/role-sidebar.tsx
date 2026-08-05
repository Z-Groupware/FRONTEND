"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ZLogo } from "@/components/icons/z-logo";
import { ROLE_LABEL } from "@/constants/domain";

import { roleHome } from "../home";
import type { NavSection } from "../nav";
import type { Viewer } from "../viewer";
import { SidebarItem } from "./sidebar-item";

interface RoleSidebarProps {
  sections: NavSection[];
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
 * ⚠️ 단순 `pathname.startsWith(item.href)`는 안 된다 — `/manage/billing`(구독·결제)이
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

      <AccountRow user={user} />
    </aside>
  );
}

/** 하단 계정 줄 — 이름 첫 글자 · 이름 · 역할 배지 */
function AccountRow({ user }: { user: Viewer }) {
  return (
    <div className="border-border flex h-[49px] shrink-0 items-center gap-[7px] border-t px-[17.5px]">
      <span className="bg-role-owner flex size-[21px] shrink-0 items-center justify-center rounded-full text-[10px] leading-none text-white">
        {user.name.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs leading-[18px]">{user.name}</span>
      <span className="bg-role-owner-surface text-role-owner shrink-0 rounded px-[5.25px] py-[1.75px] text-[9px] leading-[14px]">
        {ROLE_LABEL[user.role]}
      </span>
    </div>
  );
}
