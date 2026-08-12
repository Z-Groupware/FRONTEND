import "server-only";

import { addDays, format, startOfWeek } from "date-fns";

import { requireAccessToken } from "@/features/auth/session";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { PROJECT_TEAM_ACTIONS_MOCK } from "@/features/project/mock/team-actions";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { type Actor, requiresParentTeamAction } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import {
  type BeMeetingRoom,
  type BeRoomWeekAvailability,
  toMeetingRoom,
  toRoomWeekAvailability,
} from "./mapper";
import { listMockMembers } from "./mock/members";
import { listMockReservationsByRoom } from "./mock/reservations";
import { findMockRoom, listMockRooms } from "./mock/rooms";
import type {
  MeetingRoom,
  RoomAvailabilitySlot,
  RoomDayAvailability,
  RoomMember,
  RoomProjectOption,
  RoomTeamActionOption,
  RoomWeekAvailability,
} from "./types";

const WEEKDAYS_PER_WEEK = 5;
const SLOT_MINUTES = 30;

function toMinutesOfDay(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours! * 60 + minutes!;
}

function toHHMM(minutesOfDay: number): string {
  const hours = Math.floor(minutesOfDay / 60);
  const minutes = minutesOfDay % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** 목 데이터로 하루치 슬롯을 만든다 — 회의실 운영 시간을 30분 단위로 나누고 겹치는 예약이 있으면 RESERVED로 채운다. */
function buildMockDaySlots(date: Date, room: MeetingRoom): RoomDayAvailability {
  const reservations = listMockReservationsByRoom(room.id);
  const slots: RoomAvailabilitySlot[] = [];

  for (
    let minutesOfDay = toMinutesOfDay(room.openTime);
    minutesOfDay < toMinutesOfDay(room.closeTime);
    minutesOfDay += SLOT_MINUTES
  ) {
    const startTime = toHHMM(minutesOfDay);
    const slotStart = new Date(`${format(date, "yyyy-MM-dd")}T${startTime}:00`);
    const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60_000);
    const overlapping = reservations.find(
      (reservation) => reservation.start < slotEnd && reservation.end > slotStart,
    );

    slots.push({
      startTime,
      status: overlapping ? "RESERVED" : "AVAILABLE",
      meetingId: overlapping?.id ?? null,
      title: overlapping?.title ?? null,
    });
  }

  return { date: format(date, "yyyy-MM-dd"), slots };
}

/**
 * 회의실 하나의 주간(월~금) 슬롯 현황(`GET /api/meeting-rooms/availability`, ROOM-02).
 * 회의실이 없으면 `null`(호출부가 "존재하지 않는 회의실" 처리).
 * ⚠️ **축이 "회의실 1개 × 5일"이다**(기존 "하루 × 전체 회의실" 그리드는 폐기, 2026-08-10 전환).
 */
export async function getRoomWeekAvailability(
  roomId: string,
  weekOf: Date,
): Promise<RoomWeekAvailability | null> {
  if (isMock) {
    const room = findMockRoom(roomId);
    if (!room) return null;

    const weekStart = startOfWeek(weekOf, { weekStartsOn: 1 });
    const days = Array.from({ length: WEEKDAYS_PER_WEEK }, (_, index) =>
      buildMockDaySlots(addDays(weekStart, index), room),
    );

    return {
      weekStart: format(weekStart, "yyyy-MM-dd"),
      slotMinutes: SLOT_MINUTES,
      meetingRoom: room,
      days,
    };
  }

  const accessToken = await requireAccessToken();
  try {
    const be = await serverApi<BeRoomWeekAvailability>(
      ep.meetingRoomAvailability({
        meetingRoomId: Number(roomId),
        date: format(weekOf, "yyyy-MM-dd"),
      }),
      { accessToken },
    );
    return toRoomWeekAvailability(be);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * 회의실 목록(`GET /api/meeting-rooms`, ROOM-01) — 비활성화되지 않은 회의실을 이름 오름차순으로.
 * 예약 폼의 회의실 select와 `/manage/rooms` 관리 목록이 이 응답을 함께 쓴다.
 */
export async function getMeetingRooms(): Promise<MeetingRoom[]> {
  if (isMock) return listMockRooms();

  const accessToken = await requireAccessToken();
  const { meetingRooms } = await serverApi<{ meetingRooms: BeMeetingRoom[] }>(ep.meetingRooms(), {
    accessToken,
  });
  return meetingRooms.map(toMeetingRoom);
}

export async function getReservableMembers(): Promise<RoomMember[]> {
  if (isMock) return listMockMembers();
  throw new Error("사원 목록 조회 API가 아직 연결되지 않았습니다.");
}

/** 예약 폼의 "프로젝트" select용 — 프로젝트 도메인의 전체 목록에서 경량 필드만 골라 낸다. */
export async function getReservableProjects(): Promise<RoomProjectOption[]> {
  if (isMock) {
    return TOP_LEVEL_PROJECTS.map((project) => ({
      id: String(project.id),
      name: project.name,
      tag: project.tag,
    }));
  }
  throw new Error("프로젝트 목록 조회 API가 아직 연결되지 않았습니다.");
}

/**
 * 예약 폼의 "상위 팀 액션" select용 — Host가 Owner면 빈 배열(그 필드가 아예 안 뜬다,
 * WORKFLOW.md §3-1). Leader/Member면 **자기 팀**에 하달된 팀 액션만, 어느 프로젝트 것인지
 * `projectTag`로 같이 내려줘 화면이 지금 고른 프로젝트로 다시 거른다.
 */
export async function getReservableTeamActions(actor: Actor): Promise<RoomTeamActionOption[]> {
  if (!isMock) throw new Error("팀 액션 목록 조회 API가 아직 연결되지 않았습니다.");
  if (!requiresParentTeamAction(actor) || !actor.teamName) return [];

  const options: RoomTeamActionOption[] = [];
  for (const [projectTag, teamActions] of Object.entries(PROJECT_TEAM_ACTIONS_MOCK)) {
    for (const teamAction of teamActions) {
      if (teamAction.team === actor.teamName) {
        options.push({ id: teamAction.id, name: teamAction.name, projectTag });
      }
    }
  }
  return options;
}
