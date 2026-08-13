import "server-only";

import { addDays, format, startOfWeek } from "date-fns";

import { AUTHORITY } from "@/constants/authority";
import { requireAccessToken } from "@/features/auth/session";
import { getTeamLeaders } from "@/features/member/manage-server";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { PROJECT_TEAM_ACTIONS_MOCK } from "@/features/project/mock/team-actions";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { type Actor, requiresParentTeamAction } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { RESERVATION_DURATION_MINUTES } from "./constants";
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
    minutesOfDay += RESERVATION_DURATION_MINUTES
  ) {
    const startTime = toHHMM(minutesOfDay);
    const slotStart = new Date(`${format(date, "yyyy-MM-dd")}T${startTime}:00`);
    const slotEnd = new Date(slotStart.getTime() + RESERVATION_DURATION_MINUTES * 60_000);
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
      slotMinutes: RESERVATION_DURATION_MINUTES,
      meetingRoom: room,
      days,
    };
  }

  const accessToken = await requireAccessToken();
  try {
    const be = await serverApi<BeRoomWeekAvailability>(
      ep.meetingRoomAvailability({
        meetingRoomId: Number(roomId),
        /*
          ⚠️ **월요일로 맞춰 보낸다**(2026-08-13 고침). 그냥 넘기면 **주말에 열었을 때 화면과
             서버가 다른 주를 본다** — BE `resolveWeekStart`는 토·일이면 **다음 주 월요일**로
             넘기는데(`with(next(MONDAY))`), 캘린더는 같은 날짜를 `startOfWeek(…, {weekStartsOn: 1})`
             = **지난 월요일**로 읽어 격자를 그린다. 그러면 예약이 꽉 찬 주가 통째로 비어 보이고,
             지난 주 칸을 눌러 예약 창이 열린다.
          ⚠️ 목 분기도 같은 정규화를 한다(위 `weekStart`) — 두 경로가 갈리면 목에서만 맞는다.
        */
        date: format(startOfWeek(weekOf, { weekStartsOn: 1 }), "yyyy-MM-dd"),
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

/**
 * 참석자 후보 명부 — **범위가 회사 전체가 아니라 개설자 권한별로 갈린다**(`attendee-scope.ts`).
 * 화면(피커)이 `filterAttendeeCandidates`로 다시 거르므로 여기서는 "그 축을 채울 수 있는
 * 명부"만 구하면 된다.
 *
 * ⚠️ **Owner와 Leader·Member는 API가 다르다.**
 *    - Leader·Member: `GET /api/members/my-team`(자기 팀 로스터, ACTIVE만) — 토큰의
 *      `teamId`로 범위가 자동으로 잡힌다.
 *    - Owner: 이 엔드포인트는 팀이 없는 Owner에게 **빈 배열**을 돌려준다(BE 확인) — 대신
 *      팀마다 리더 한 명을 세는 `getTeamLeaders()`(`ep.teams()`)를 그대로 쓴다. Owner가
 *      고를 수 있는 후보가 정확히 "팀별 리더"라, 이미 있는 함수와 목적이 같다.
 * ⚠️ **`authority` 필드는 두 갈래 다 정확하지 않을 수 있다.** `isAttendeeInScope`가 Leader·
 *    Member 분기에서는 `teamName`만 보고 `authority`를 안 읽으므로(코드 참고) 문제가 안 된다 —
 *    Owner 분기에서만 `authority===LEADER`가 실제로 걸리는데, `getTeamLeaders()`가 주는
 *    사람은 정의상 전부 리더라 항상 참이다.
 */
export async function getReservableMembers(actor: Actor): Promise<RoomMember[]> {
  if (isMock) return listMockMembers();

  if (actor.role === AUTHORITY.OWNER) {
    const leaders = await getTeamLeaders();
    return Array.from(leaders.entries()).map(([teamName, leader]) => ({
      id: leader.id,
      name: leader.name,
      teamName,
      authority: AUTHORITY.LEADER,
    }));
  }

  const accessToken = await requireAccessToken();
  const roster = await serverApi<{ memberId: number; name: string }[]>(ep.membersMyTeam(), {
    accessToken,
  });
  return roster.map((row) => ({
    id: row.memberId,
    name: row.name,
    teamName: actor.teamName ?? null,
    /*
      ⚠️ 실제 값이 아니다 — 이 분기(Leader·Member)의 범위 판정은 `teamName`만 보고 이 필드는
         읽지 않는다(`attendee-scope.ts`). 타입을 채우기 위한 자리표시자다.
    */
    authority: AUTHORITY.MEMBER,
  }));
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
