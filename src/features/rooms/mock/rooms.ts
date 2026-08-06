import type { MeetingRoom } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전(ERD·API 스펙 미확정, DECISIONS.md).
 * 회의실 CUD는 이 화면 소관이 아니다(`/manage/rooms`) — 여기서는 목록만 읽는다.
 */
export const MEETING_ROOMS: MeetingRoom[] = [
  { id: "room-large", name: "대회의실", capacity: 8, openTime: "09:00", closeTime: "18:00" },
  { id: "room-small-a", name: "소회의실 A", capacity: 4, openTime: "09:00", closeTime: "18:00" },
  { id: "room-small-b", name: "소회의실 B", capacity: 4, openTime: "09:00", closeTime: "18:00" },
  { id: "room-video", name: "화상회의실", capacity: 6, openTime: "09:00", closeTime: "18:00" },
];

export function listMockRooms(): MeetingRoom[] {
  return MEETING_ROOMS;
}

export function findMockRoom(id: string): MeetingRoom | null {
  return MEETING_ROOMS.find((room) => room.id === id) ?? null;
}
