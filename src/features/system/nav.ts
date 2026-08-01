import type { NavSection } from "@/features/shell/nav";

/**
 * SYSTEM(서비스 운영자) 사이드바 구성.
 *
 * ⚠️ 지금은 대시보드만 실제 화면이다 — 나머지는 `isReady` 없이 둬서
 *    눌러도 "준비 중" 안내만 뜨게 한다(CLAUDE.md §정직성).
 */
export const SYSTEM_NAV: NavSection[] = [
  {
    title: "운영 메뉴",
    items: [
      { href: "/system", label: "대시보드", icon: "dashboard", isReady: true },
      { href: "/system/approval", label: "기업 승인", icon: "approval" },
      { href: "/system/companies", label: "기업 관리", icon: "company" },
      { href: "/system/billing", label: "구독·매출", icon: "billing" },
      { href: "/system/monitoring", label: "시스템 모니터링", icon: "monitor" },
      { href: "/system/notice", label: "공지", icon: "notice" },
    ],
  },
];
