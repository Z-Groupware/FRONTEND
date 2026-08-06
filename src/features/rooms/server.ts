import "server-only";

import { endOfWeek, startOfWeek } from "date-fns";

import { isMock } from "@/mocks/config";

import { listMockMembers } from "./mock/members";
import { listMockReservations } from "./mock/reservations";
import { listMockRooms } from "./mock/rooms";
import type { MeetingRoom, RoomMember, RoomReservation } from "./types";

/**
 * 그 주(월요일 시작)와 겹치는 예약만 걸러 내려준다. 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ 예약 시작일 기준이 아니라 **그 주와 겹치는지**(start~end 구간)로 본다 — 지금은 예약이
 *    전부 하루 안에서 끝나 차이가 없지만, 개인 캘린더 월 필터와 같은 이유로 구간 비교로 둔다.
 */
export async function getWeekReservations(weekOf: Date): Promise<RoomReservation[]> {
  if (isMock) {
    const weekStart = startOfWeek(weekOf, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekOf, { weekStartsOn: 1 });
    return listMockReservations().filter(
      (reservation) => reservation.start <= weekEnd && reservation.end >= weekStart,
    );
  }

  // ⚠️ 미구현 — API 스펙 확정 후 회의실 예약 조회 경로를 매퍼로 UI 계약에 맞춘다.
  throw new Error("회의실 예약 조회 API가 아직 연결되지 않았습니다.");
}

export async function getMeetingRooms(): Promise<MeetingRoom[]> {
  if (isMock) return listMockRooms();
  throw new Error("회의실 목록 조회 API가 아직 연결되지 않았습니다.");
}

export async function getReservableMembers(): Promise<RoomMember[]> {
  if (isMock) return listMockMembers();
  throw new Error("사원 목록 조회 API가 아직 연결되지 않았습니다.");
}
