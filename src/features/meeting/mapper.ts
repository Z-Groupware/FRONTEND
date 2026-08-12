/**
 * BE shape → UI 계약 (§Mock 격리막). 컴포넌트는 이 파일을 모른다 — `server.ts`만 쓴다.
 * [확인] MEET-03 계약(2026-08-12) 기준 — BE 실코드는 아직 대조 전이다(§연동 검증).
 */

import type { DashboardMeeting } from "@/components/common/dashboard-meeting-item";
import type { MeetingStatus } from "@/constants/meeting";

/**
 * `GET /api/meetings/upcoming`(MEET-03) 목록 원소.
 * ⚠️ `meetingRoom`·`project`의 내부 모양은 계약에 명시가 없다 — 회의실 도메인(`BeMeetingRoom`)·
 *    예약 폼의 프로젝트 select(`RoomProjectOption`)와 같은 최소 모양으로 가정한다("가정 shape·
 *    미검증" 주석, CLAUDE.md §연동 검증).
 * ⚠️ 개설자(host) 이름·소속 라벨은 이 계약에 없다 — `isHost`(보는 사람이 host인가)뿐이라
 *    "누가 개설했는가"는 여기서 못 구한다(§mapper `toDashboardMeeting` 참고).
 */
export interface BeUpcomingMeeting {
  meetingId: number;
  title: string;
  status: string;
  startAt: string;
  endAt: string;
  attendeeCount: number;
  isHost: boolean;
  entryAvailable: boolean;
  meetingRoom: { meetingRoomId: number; name: string };
  project: { projectId: number; tag: string };
}

export interface BeUpcomingMeetingsResponse {
  meetings: BeUpcomingMeeting[];
}

/**
 * 대시보드 "참석 회의" 위젯(`DashboardMeetingItem`)이 받는 모양으로 바꾼다.
 * ⚠️ `originLabel`을 안 채운다 — 이 계약엔 개설자 소속(Owner 개설/팀명) 정보가 없다. 없는 값을
 *    지어내지 않는다(§정직성) — 화면은 그 값이 없으면 라벨을 그냥 안 그린다(`hostLabel`과
 *    같은 선택 필드로 취급).
 * ⚠️ `entryAvailable`·`isHost`는 지금 이 위젯에 [입장] 버튼이 없어(WORKFLOW.md §3-2, 목록
 *    화면의 카드에만 있음) 쓰지 않는다 — 화면에 없는 기능을 새로 만들지 않는다(§명세).
 */
export function toDashboardMeeting(be: BeUpcomingMeeting): DashboardMeeting {
  return {
    id: String(be.meetingId),
    title: be.title,
    projectTag: be.project.tag,
    status: be.status as MeetingStatus,
    room: be.meetingRoom.name,
    scheduledAt: be.startAt,
    attendeeCount: be.attendeeCount,
  };
}
