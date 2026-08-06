/**
 * 회의실 예약(주간 캘린더) — 격리막의 UI 계약(CLAUDE.md §Mock 격리막).
 * 컴포넌트는 이 타입만 알고, 목/실서버 분기는 `server.ts`가 끝낸다.
 */

import type { MeetingTopicMain } from "@/constants/meeting";

/** 회의실 한 곳. 운영시간은 전 회의실 09:00~18:00 동일(팀 워크플로우 목업). */
export interface MeetingRoom {
  id: string;
  name: string;
  /** 수용 인원 */
  capacity: number;
  /** "HH:mm" */
  openTime: string;
  /** "HH:mm" */
  closeTime: string;
}

/** 참석자 검색 대상 — 예약 폼의 "참석자" 피커가 쓴다. */
export interface RoomMember {
  id: number;
  name: string;
}

/** 예약 폼의 "프로젝트" select가 쓰는 경량 항목 — 프로젝트 도메인 전체 타입을 끌어오지 않는다. */
export interface RoomProjectOption {
  id: string;
  name: string;
  tag: string;
}

/**
 * 주간 캘린더 한 칸에 그려지는 예약 건. react-big-calendar의 start/end 접근자가 이 필드명을 그대로 쓴다.
 * ⚠️ 막대 색은 여기 없다 — `projectTag`를 화면에서 `pickPaletteColor`에 넘겨 그때 뽑는다
 *    (프로젝트 태그·아바타와 같은 팔레트, CLAUDE.md §디자인 토큰: 하드코딩 금지).
 */
export interface RoomReservation {
  id: string;
  title: string;
  start: Date;
  end: Date;
  roomId: string;
  roomName: string;
  /** 프로젝트에 안 묶인 예약도 있다(예: 팀 위클리 싱크) — 그럴 땐 중립색을 쓴다. */
  projectId?: string;
  projectTag?: string;
  topicMain: MeetingTopicMain;
  /** 소주제 라벨(한글) — 목록·상세 표시용으로 이미 라벨을 들고 있다. */
  topicSub: string;
  attendeeIds: number[];
  /** 담당자 — 이 예약의 시간을 바꿀 수 있는 유일한 사람(권한 ②축, CLAUDE.md §권한). */
  ownerId: number;
}

/**
 * 회의실 예약 폼 입력 — 화면과 서버가 같은 스키마(`validate.ts`)로 검증한다.
 * ⚠️ 종료 시각은 입력받지 않는다 — 예약은 **30분 한 타임 고정**이라(팀 확정,
 *    CLAUDE.md §브라우저 API) 시작 시각만 받고 길이는 서버가 계산한다.
 */
export interface RoomReservationDraft {
  title: string;
  roomId: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" — 30분 단위 슬롯의 시작 시각 */
  startTime: string;
  projectId?: string;
  /** MEETING_TOPIC_MAIN 코드값 */
  topicMain: string;
  /** MEETING_TOPIC_SUB[topicMain]의 value 코드값 */
  topicSub: string;
  attendeeIds: number[];
}

export type RoomReservationFormErrors = Partial<Record<keyof RoomReservationDraft, string>>;
