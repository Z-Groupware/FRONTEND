/**
 * 회원 상태 — **화면에 보이는 셋이 전부**다(2026-08-05 확정).
 *
 * ⚠️ `WAITING`은 "계정 발급 후 미로그인"이 아니라 **휴직·오프보딩을 신청하고 승인을 기다리는**
 *    상태다. 이름만 보고 온보딩 대기로 읽으면 화면 분기가 틀린다.
 * ⚠️ BE enum과 **이름·값이 같다**(2026-08-05 확정). 휴직은 `VACATION` 하나다 —
 *    한때 `ON_LEAVE`라는 다른 표기가 돌았는데 같은 뜻이었고, `VACATION`으로 정리됐다.
 * ⚠️ **소프트 딜리트는 `DELETED`** 이고 여기 넣지 않는다. 지워진 사람은 상태가 아니라
 *    목록에서 빠지는 일이라, 화면 상태에 섞으면 `재직·휴직·대기` 필터에 넷째 칸이 생긴다.
 *    BE가 그 값을 내려보내면 **매퍼에서 걸러 낸다** — 컴포넌트까지 들어오지 않게 한다.
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
