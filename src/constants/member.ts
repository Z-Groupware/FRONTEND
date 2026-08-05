/**
 * 회원 상태 — **화면에 보이는 셋이 전부**다(2026-08-05 확정).
 *
 * ⚠️ `WAITING`은 "계정 발급 후 미로그인"이 아니라 **휴직·오프보딩을 신청하고 승인을 기다리는**
 *    상태다. 이름만 보고 온보딩 대기로 읽으면 화면 분기가 틀린다.
 * ⚠️ BE enum과 **이름·값이 같아야 한다**. `ON_LEAVE`처럼 BE가 내부용으로 들고 있는 값은
 *    화면 상태로 쓰지 않는다 — 회원 도메인 담당자 문서로 확인해 맞춘다.
 *
 * 역할·겸직 권한 상수는 `role.ts`에 있다.
 */
export const MEMBER_STATUS = {
  ACTIVE: "ACTIVE",
  VACATION: "VACATION",
  /** 휴직·오프보딩 신청 후 승인 대기 */
  WAITING: "WAITING",
} as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "재직",
  VACATION: "휴직",
  WAITING: "대기",
};
