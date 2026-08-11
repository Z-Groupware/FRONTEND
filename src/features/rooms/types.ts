/**
 * 회의실 예약(주간 캘린더) — 격리막의 UI 계약(CLAUDE.md §Mock 격리막).
 * 컴포넌트는 이 타입만 알고, 목/실서버 분기는 `server.ts`가 끝낸다.
 */

import type { Authority } from "@/constants/authority";

/**
 * 회의실 한 곳.
 * ⚠️ **"수용 인원" 필드는 없다**(WORKFLOW.md §10-A 확정 — 전면 폐기). 화면·모달·데이터 구조
 *    어디에도 안 둔다. 대신 "위치"가 있다.
 */
export interface MeetingRoom {
  id: string;
  name: string;
  /** 자유 텍스트 — "3층 A동"처럼(WORKFLOW.md §10-A) */
  location: string;
  /** "HH:mm" */
  openTime: string;
  /** "HH:mm" */
  closeTime: string;
}

/**
 * 회의실 추가·수정 폼 입력(`/manage/rooms`, is_admin 전용) — 화면과 서버가 같은 스키마로 검증한다.
 * ⚠️ 예약 승인 절차가 없다(WORKFLOW.md §10-A) — 만들면 바로 예약 가능한 목록에 들어간다.
 */
export interface MeetingRoomDraft {
  name: string;
  location: string;
  /** "HH:mm" */
  openTime: string;
  /** "HH:mm" */
  closeTime: string;
}

export type MeetingRoomFormErrors = Partial<Record<keyof MeetingRoomDraft, string>>;

/**
 * 참석자 검색 대상 — 예약 폼의 "참석자" 피커가 쓴다.
 * ⚠️ `teamName`·`authority`는 "팀장급만"·"내 부서만" 필터(`RoomAttendeePicker`)를 위해서만
 *    쓴다 — 사원 도메인 전체 타입은 여전히 안 끌어온다(§경량 항목).
 */
export interface RoomMember {
  id: number;
  name: string;
  /** Owner는 팀이 없다(`null`, CLAUDE.md §조직 계층). */
  teamName: string | null;
  authority: Authority;
}

/** 예약 폼의 "프로젝트" select가 쓰는 경량 항목 — 프로젝트 도메인 전체 타입을 끌어오지 않는다. */
export interface RoomProjectOption {
  id: string;
  name: string;
  tag: string;
}

/**
 * 예약 폼의 "상위 팀 액션" select가 쓰는 경량 항목 — Host가 Owner가 아닐 때만 뜬다
 * (WORKFLOW.md §3-1). `projectTag`로 지금 고른 프로젝트에 속한 것만 걸러 보여준다.
 */
export interface RoomTeamActionOption {
  id: number;
  name: string;
  projectTag: string;
}

/** 회의 안건 대주제/소주제 한 쌍 — 자유 입력 텍스트다(고정 enum 아님, WORKFLOW.md §3-1). */
export interface MeetingTopicInput {
  main: string;
  sub: string;
}

/**
 * 주간 캘린더 한 칸에 그려지는 예약 건. react-big-calendar의 start/end 접근자가 이 필드명을 그대로 쓴다.
 * ⚠️ 막대 색은 여기 없다 — `projectTag`를 화면에서 `pickPaletteColor`에 넘겨 그때 뽑는다
 *    (프로젝트 태그·아바타와 같은 팔레트, CLAUDE.md §디자인 토큰: 하드코딩 금지).
 * ⚠️ 프로젝트 태그는 **항상 있다**(WORKFLOW.md §3-1 확정 — 프로젝트 없는 회의는 없다).
 */
export interface RoomReservation {
  id: string;
  title: string;
  start: Date;
  end: Date;
  roomId: string;
  roomName: string;
  projectId: string;
  projectTag: string;
  /** 최소 1쌍 — 나머지는 폼에서 "추가/삭제"로 늘고 준다. */
  topics: MeetingTopicInput[];
  attendeeIds: number[];
  /** 담당자 — 이 예약의 시간을 바꿀 수 있는 유일한 사람(권한 ②축, CLAUDE.md §권한). */
  ownerId: number;
}

/**
 * 회의실 예약 폼 입력 — 화면과 서버가 같은 스키마(`validate.ts`)로 검증한다.
 * ⚠️ 종료 시각은 입력받지 않는다 — 예약은 **30분 한 타임 고정**이라(팀 확정,
 *    CLAUDE.md §브라우저 API) 시작 시각만 받고 길이는 서버가 계산한다.
 * ⚠️ "회의실 예약 = 회의 개설"이 한 동작이라(WORKFLOW.md §3-1) 이 드래프트가 회의 쪽 입력도
 *    같이 들고 있다 — `parentTeamActionId`는 Host가 Owner가 아닐 때만 필수다.
 */
export interface RoomReservationDraft {
  title: string;
  roomId: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" — 30분 단위 슬롯의 시작 시각 */
  startTime: string;
  /** 항상 필수다(WORKFLOW.md §3-1) — "프로젝트에 안 묶인 예약"은 없다. */
  projectId: string;
  topics: MeetingTopicInput[];
  attendeeIds: number[];
  /** Host가 Leader/Member일 때만 필수 — 그 프로젝트 내 자기 팀에 하달된 팀 액션 중 하나. */
  parentTeamActionId?: number;
}

export type RoomReservationFormErrors = Partial<Record<keyof RoomReservationDraft, string>>;
