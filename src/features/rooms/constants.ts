/**
 * 클라이언트·서버 양쪽에서 쓰는 순수 상수만 모은다.
 * ⚠️ `validate.ts`에 두지 않는다 — `validate.ts`는 `lib/permission.ts`(`server-only`)를
 *    가져오는데, 이 상수는 클라이언트 컴포넌트(`room-reservation-dialog.tsx`)도 써야 해서
 *    그 경로로 가져오면 `server-only`가 클라이언트 번들까지 끌려온다(빌드 에러).
 */

/** 예약 길이 — 팀 확정: 30분 한 타임, 연장하지 않는다(CLAUDE.md §브라우저 API). */
export const RESERVATION_DURATION_MINUTES = 30;

/**
 * 회의실 운영 시간(분 단위, 09:00~18:00) — `validate.ts`(서버·폼 검증)와 "예약하기" 버튼의
 * 기본 슬롯 계산(`next-available-slot.ts`)이 같은 값을 쓴다. 한쪽만 고치면 어긋난다.
 */
export const ROOM_OPERATING_START_MINUTES = 9 * 60;
export const ROOM_OPERATING_END_MINUTES = 18 * 60;

/**
 * 참석자 피커 필터 3종 — `RoomAttendeePicker`가 쓴다.
 * ⚠️ 세 값은 서로 배타적이라 라디오그룹으로 짠다(`role="radiogroup"`, `RoomPickerList`와 같은 패턴).
 */
export const ROOM_ATTENDEE_FILTER = {
  ALL: "all",
  LEADER: "leader",
  MY_TEAM: "myTeam",
} as const;
export type RoomAttendeeFilter = (typeof ROOM_ATTENDEE_FILTER)[keyof typeof ROOM_ATTENDEE_FILTER];

export const ROOM_ATTENDEE_FILTER_LABEL: Record<RoomAttendeeFilter, string> = {
  all: "전체",
  leader: "팀장급만",
  myTeam: "내 부서만",
};
