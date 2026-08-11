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

/** 회의실 주간 캘린더 툴바(`rooms-calendar-toolbar.tsx`) 카피 — 라벨 하드코딩 금지 원칙에 맞춰 뺐다. */
export const ROOMS_CALENDAR_TOOLBAR_LABEL = {
  roomFilter: "회의실 필터",
  allRooms: "전체 회의실",
  addMeeting: "회의 추가",
} as const;

/** 회의실 삭제 확인창 문구 — `room-delete-dialog.tsx` 하나만 쓰지만, 카피 하드코딩 금지
 * 원칙(CLAUDE.md §도메인 상수)에 맞춰 컴포넌트 밖으로 뺐다(`NOTICE_DELETE_CONFIRM`과 같은 자리). */
export const ROOM_DELETE_CONFIRM = {
  /** 확인창 제목 — 회의실 이름을 끼워 넣는다 */
  title: (roomName: string) => `'${roomName}'을 삭제할까요?`,
  description: "삭제하면 예약 화면 목록에서도 사라집니다. 되돌릴 수 없습니다.",
  confirmLabel: "삭제",
  pendingLabel: "삭제 중",
} as const;
