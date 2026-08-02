/**
 * 역할 네 가지 — 탭 색·배지·기본 화면 구성.
 *
 * ⚠️ 역할 이름은 **영어**로 쓴다(CLAUDE.md §카피: 역할 워딩은 영어).
 * ⚠️ 역할 색은 역할 배지 토큰(`--role-*`)을 그대로 쓴다 — 랜딩은 그 토큰을 밝기에 맞춰 뒤집는다.
 * ⚠️ 고른 탭의 글자는 `text-background`다. 밝은 역할색 위에 흰 글자를 얹으면 읽히지 않는다.
 */
export const ROLE_VIEWS = [
  {
    name: "Owner",
    korean: "대표",
    chip: "bg-role-owner-surface text-role-owner",
    activeTab: "bg-role-owner text-background",
    body: "조직 전체 현황을 한눈에 보고, 인수인계를 최종 승인해요.",
    screen: "대시보드",
    nav: ["대시보드", "사원 관리", "구독·결제"],
  },
  {
    name: "Admin",
    korean: "관리자",
    chip: "bg-role-admin-surface text-role-admin",
    activeTab: "bg-role-admin text-background",
    body: "계정을 발급하고 사원·회의실을 관리해요.",
    screen: "사원 관리",
    nav: ["사원 관리", "회의실", "계정 발급"],
  },
  {
    name: "Leader",
    korean: "팀장",
    chip: "bg-role-leader-surface text-role-leader",
    activeTab: "bg-role-leader text-background",
    body: "팀원의 액션을 보고, 인수인계를 넘겨받아 나눠줘요.",
    screen: "팀 보드",
    nav: ["팀 보드", "회의", "인수인계"],
  },
  {
    name: "Member",
    korean: "사원",
    chip: "bg-role-member-surface text-role-member",
    activeTab: "bg-role-member text-background",
    body: "내게 배정된 액션만 보면 됩니다. 회의도 직접 열 수 있어요.",
    screen: "내 업무",
    nav: ["내 업무", "회의", "캘린더"],
  },
] as const;

export type RoleName = (typeof ROLE_VIEWS)[number]["name"];
