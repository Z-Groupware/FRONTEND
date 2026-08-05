"use client";

import {
  CalendarDays,
  CalendarRange,
  Columns3,
  CreditCard,
  Folder,
  HardDrive,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  Search,
  Settings,
  UserRound,
  UserRoundCheck,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import type { NavIconName, NavItem } from "../nav";

/**
 * 이름 → 아이콘. 구성 파일은 서버에서 읽히므로 실제 컴포넌트는 여기서 붙인다.
 * OWNER_NAV가 쓰는 이름만 채운다 — `Partial`이라 나머지(SYSTEM 전용 등)는 없어도 된다.
 */
const NAV_ICON: Partial<Record<NavIconName, LucideIcon>> = {
  dashboard: LayoutDashboard,
  project: Folder,
  search: Search,
  calendar: CalendarDays,
  notice: Megaphone,
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

const SHAPE = "flex h-[34px] items-center gap-[8.75px] rounded-md px-[10.5px] transition-colors";

/** 사이드바 한 줄 — 준비된 화면은 링크, 아직 없는 화면은 알림 버튼이다 */
export function SidebarItem({ item, isCurrent }: { item: NavItem; isCurrent: boolean }) {
  const inner = <SidebarItemInner item={item} />;

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
          SHAPE,
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
        SHAPE,
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

/** 아이콘 · 라벨 · 표시(안 읽음 점 / 개수) — 링크든 버튼이든 안은 같다 */
function SidebarItemInner({ item }: { item: NavItem }) {
  const Icon = NAV_ICON[item.icon] ?? LayoutDashboard;

  return (
    <>
      <Icon className="size-[14px] shrink-0" aria-hidden />
      {/* 한글 글자가 상자 안에서 위쪽에 앉아 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
      <span className="min-w-0 flex-1 translate-y-px truncate text-[13px] leading-5">
        {item.label}
      </span>
      {item.dot && (
        <>
          <span className="bg-destructive size-[6px] shrink-0 rounded-full" aria-hidden />
          <span className="sr-only">안 읽음</span>
        </>
      )}
      {item.badge !== undefined && (
        <span className="bg-foreground text-background flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full px-[3.5px] text-[10px] leading-none font-semibold tabular-nums">
          {item.badge}
        </span>
      )}
    </>
  );
}
