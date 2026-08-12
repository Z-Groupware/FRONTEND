import "server-only";

import { endOfWeek, startOfWeek } from "date-fns";

import { requireAccessToken } from "@/features/auth/session";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { PROJECT_TEAM_ACTIONS_MOCK } from "@/features/project/mock/team-actions";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { type Actor, requiresParentTeamAction } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { type BeMeetingRoom, toMeetingRoom } from "./mapper";
import { listMockMembers } from "./mock/members";
import { listMockReservations } from "./mock/reservations";
import { listMockRooms } from "./mock/rooms";
import type {
  MeetingRoom,
  RoomMember,
  RoomProjectOption,
  RoomReservation,
  RoomTeamActionOption,
} from "./types";

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
