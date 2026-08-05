/**
 * 사이드바 구성.
 *
 * ⚠️ **아이콘을 컴포넌트로 두지 않는다.** 이 파일은 서버 컴포넌트(레이아웃)에서 읽어
 *    클라이언트 사이드바로 넘어간다 — 함수는 직렬화되지 않아 그대로 터진다.
 *    여기서는 **이름만** 두고 실제 아이콘은 사이드바(클라이언트)에서 붙인다.
 */
export type NavIconName =
  | "dashboard"
  | "project"
  | "search"
  | "calendar"
  | "notice"
  | "meeting"
  | "room"
  | "board"
  | "people"
  | "me"
  | "members"
  | "billing"
  | "storage"
  | "setting"
  | "approval"
  | "company"
  | "monitor";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
  /**
   * 화면이 실제로 있는가.
   *
   * ⚠️ `false`면 **눌리지 않는다.** 아직 안 만든 메뉴를 링크로 두면 404가 뜬다 —
   *    안 되는 걸 되는 척하지 않는다(CLAUDE.md §정직성). 화면이 붙으면 `true`로 바꾼다.
   */
  isReady?: boolean;
  /** 오른쪽에 붙는 숫자(처리할 일 수) */
  badge?: number;
  /**
   * 미읽음 등 "안 본 게 있음"을 알리는 빨간 점. 숫자(`badge`)와 달리 개수는 안 보여준다.
   * ⚠️ 정적 구성이 아니라 **레이아웃이 서버에서 계산해 끼워 넣는다**(예: 공지 미읽음 수 > 0).
   */
  dot?: boolean;
}

export interface NavSection {
  /** 구역 제목. 첫 구역은 제목 없이 바로 나온다 */
  title?: string;
  items: NavItem[];
}

/**
 * OWNER 사이드바 구성.
 *
 * ⚠️ 역할마다 **레이아웃이 아니라 이 목록만** 달라진다(CLAUDE.md §라우트 그룹:
 *    레이아웃 1개 + 역할별 네비 구성). ADMIN·LEADER·MEMBER용은 각자 화면을 만들 때 추가한다.
 */
export const OWNER_NAV: NavSection[] = [
  {
    items: [
      { href: "/owner", label: "대시보드", icon: "dashboard" },
      { href: "/app/projects", label: "프로젝트", icon: "project" },
      { href: "/app/search", label: "검색", icon: "search" },
      { href: "/app/calendar", label: "캘린더", icon: "calendar" },
      { href: "/app/notice", label: "공지", icon: "notice", isReady: true },
    ],
  },
  {
    title: "워크벤치",
    items: [
      { href: "/app/meeting", label: "회의", icon: "meeting" },
      { href: "/app/rooms", label: "회의실", icon: "room" },
      { href: "/app/board", label: "보드", icon: "board" },
      { href: "/app/people", label: "사람", icon: "people" },
      { href: "/app/me", label: "마이페이지", icon: "me", isReady: true },
    ],
  },
  {
    title: "회사 운영",
    items: [
      /*
        ⚠️ 관리 기능은 **`/manage/*` 하나**로 모은다(팀 URL 문서 2026-08-05).
           OWNER와 Admin 겸직자가 같이 쓰는 화면이라 `/owner/*`에 두면 겸직자에게 주소가
           거짓말을 하고, 두 곳에 나눠 두면 같은 화면이 두 벌이 된다.
           가드는 `역할 === admin`이 아니라 **`role === "owner" || isAdmin`** 이다.
      */
      { href: "/manage/members", label: "사원 관리", icon: "members" },
      { href: "/manage/billing", label: "구독·결제", icon: "billing", isReady: true },
      { href: "/manage/storage", label: "녹음 용량", icon: "storage" },
      { href: "/owner/setting", label: "기업 설정", icon: "setting" },
    ],
  },
];
