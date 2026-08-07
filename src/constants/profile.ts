/** 마이페이지 "기본 정보" 카드 라벨 — 화면 문구는 상수에서만 가져온다(§도메인 상수: 라벨 하드코딩 금지). */
export const PROFILE_INFO_CARD_TITLE = "기본 정보";

export const PROFILE_INFO_ROW_LABEL = {
  NAME: "이름",
  EMAIL: "이메일",
  TEAM: "팀",
  POSITION: "직급",
  JOINED_AT: "입사일",
} as const;

/**
 * 마이페이지 탭 — "미확정 액션"은 2026-08-07 사용자 확정. "내 액션"(`/app/my/actions`)에
 * 두려 했으나 Owner가 접근 못 하는 화면이라, 회의 Host가 Owner여도 항상 볼 수 있는
 * 마이페이지 쪽으로 옮겼다(WORKFLOW.md 미기재 — 이 화면 자체가 이번에 새로 확정된 정책).
 */
export const PROFILE_TAB = {
  INFO: "info",
  UNCONFIRMED: "unconfirmed",
} as const;
export type ProfileTab = (typeof PROFILE_TAB)[keyof typeof PROFILE_TAB];

export const PROFILE_TAB_LABEL: Record<ProfileTab, string> = {
  info: "기본 정보",
  unconfirmed: "미확정 액션",
};

export const DEFAULT_PROFILE_TAB: ProfileTab = PROFILE_TAB.INFO;
