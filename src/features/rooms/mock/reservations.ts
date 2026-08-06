import { MEETING_TOPIC_SUB, type MeetingTopicMain } from "@/constants/meeting";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";

import type { RoomReservation, RoomReservationDraft } from "../types";
import { RESERVATION_DURATION_MINUTES } from "../validate";
import { findMockRoom } from "./rooms";

/**
 * ⚠️ 목 데이터 — BE 연동 전. **서버 프로세스 메모리에만 있다**(재시작하면 초기값으로 되돌아간다).
 * 예약 생성 Server Action이 이 배열을 직접 바꾼다 — 실제 DB 흉내다.
 * ⚠️ 상태를 `globalThis`에 매단다 — dev의 HMR로 `let`이 초기화되면 방금 만든 예약이 사라진다
 *    (개인 캘린더 목과 같은 트릭, `calendar/mock/events.ts`).
 */
interface ReservationStore {
  reservations: RoomReservation[];
  sequence: number;
}

/**
 * 오늘(2026-08-06)이 속한 주(월 8/3~금 8/7) 기준 시드.
 * ⚠️ **회의는 예외 없이 30분 고정이다**(팀 확정, CLAUDE.md §브라우저 API) — 목 데이터도 이
 *    규칙을 그대로 지킨다. 90분·2시간짜리 목업을 두면 "30분 고정"이 화면에서부터 거짓말이 된다.
 */
const INITIAL: RoomReservation[] = [
  {
    id: "reservation-1",
    title: "Q3 OKR 중간 점검",
    start: new Date("2026-08-03T09:00:00"),
    end: new Date("2026-08-03T09:30:00"),
    roomId: "room-small-b",
    roomName: "소회의실 B",
    topicMain: "TEAM",
    topicSub: "위클리 싱크",
    attendeeIds: [1, 2, 3],
    ownerId: 1,
  },
  {
    id: "reservation-2",
    title: "마케팅 채널 전략 논의",
    start: new Date("2026-08-03T10:00:00"),
    end: new Date("2026-08-03T10:30:00"),
    roomId: "room-large",
    roomName: "대회의실",
    projectId: "p-brand",
    projectTag: "BRAND",
    topicMain: "MARKETING",
    topicSub: "채널 전략",
    attendeeIds: [1, 2, 3],
    ownerId: 2,
  },
  {
    id: "reservation-3",
    title: "8월 제품 로드맵 검토",
    start: new Date("2026-08-03T14:00:00"),
    end: new Date("2026-08-03T14:30:00"),
    roomId: "room-large",
    roomName: "대회의실",
    projectId: "p-goods",
    projectTag: "GOODS",
    topicMain: "PRODUCT",
    topicSub: "로드맵 검토",
    attendeeIds: [1, 2, 3, 4],
    ownerId: 1,
  },
  {
    id: "reservation-4",
    title: "인프라 마이그레이션 리뷰",
    start: new Date("2026-08-05T15:30:00"),
    end: new Date("2026-08-05T16:00:00"),
    roomId: "room-small-a",
    roomName: "소회의실 A",
    projectId: "p-collab",
    projectTag: "COLLAB",
    topicMain: "INFRA",
    topicSub: "마이그레이션 리뷰",
    attendeeIds: [4, 5, 6],
    ownerId: 4,
  },
  {
    id: "reservation-5",
    title: "팀 위클리 싱크",
    start: new Date("2026-08-06T11:00:00"),
    end: new Date("2026-08-06T11:30:00"),
    roomId: "room-video",
    roomName: "화상회의실",
    topicMain: "TEAM",
    topicSub: "위클리 싱크",
    attendeeIds: [2, 3, 7],
    ownerId: 2,
  },
];

const globalStore = globalThis as typeof globalThis & {
  __roomReservationStore?: ReservationStore;
};
const store: ReservationStore = (globalStore.__roomReservationStore ??= {
  reservations: INITIAL,
  sequence: INITIAL.length,
});

export function listMockReservations(): RoomReservation[] {
  return store.reservations;
}

export function listMockReservationsByRoom(roomId: string): RoomReservation[] {
  return store.reservations.filter((reservation) => reservation.roomId === roomId);
}

export function findMockReservation(id: string): RoomReservation | null {
  return store.reservations.find((reservation) => reservation.id === id) ?? null;
}

/**
 * 예약 생성 — 시작 시각 + 고정 30분으로 종료 시각을 계산하고, roomId/projectId/topicSub
 * 코드값을 표시용 이름·태그·라벨로 채워 넣는다(컴포넌트는 코드값을 모른다, §Mock 격리막).
 * ⚠️ 같은 회의실·시간대 중복 여부는 여기서 보지 않는다 — 호출부(`actions.ts`)가 먼저 확인한다.
 */
export function addMockReservation(draft: RoomReservationDraft, ownerId: number): RoomReservation {
  const room = findMockRoom(draft.roomId);
  const start = new Date(`${draft.date}T${draft.startTime}:00`);
  const end = new Date(start.getTime() + RESERVATION_DURATION_MINUTES * 60_000);
  const topicMain = draft.topicMain as MeetingTopicMain;
  const topicSub =
    MEETING_TOPIC_SUB[topicMain]?.find((sub) => sub.value === draft.topicSub)?.label ??
    draft.topicSub;
  const project = TOP_LEVEL_PROJECTS.find((item) => item.id === draft.projectId);

  const reservation: RoomReservation = {
    id: `reservation-${++store.sequence}`,
    title: draft.title.trim(),
    start,
    end,
    roomId: draft.roomId,
    roomName: room?.name ?? draft.roomId,
    projectId: draft.projectId,
    projectTag: project?.tag,
    topicMain,
    topicSub,
    attendeeIds: draft.attendeeIds,
    ownerId,
  };
  store.reservations = [...store.reservations, reservation];
  return reservation;
}
