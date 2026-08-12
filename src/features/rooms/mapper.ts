/**
 * BE shape → UI 계약 (§Mock 격리막). 컴포넌트는 이 파일을 모른다 — `server.ts`/`actions.ts`만 쓴다.
 * [확인] 회의실 도메인 문서(ROOM-01~05, 2026-08-12) 기준 — BE 실코드는 아직 대조 전이다
 *   (§연동 검증: Swagger·구두 추측 금지, 문서와 코드가 다르면 코드가 맞다 — 구현 시 컨트롤러로 재확인).
 */

import type {
  MeetingRoom,
  MeetingRoomDraft,
  RoomCalendarEvent,
  RoomDayAvailability,
  RoomReservation,
  RoomReservationDraft,
  RoomSlotStatus,
  RoomWeekAvailability,
} from "./types";

/** `GET /api/meeting-rooms` 배열 원소, `POST`·`PATCH` 성공 응답의 회의실 부분과 같은 모양. */
export interface BeMeetingRoom {
  meetingRoomId: number;
  name: string;
  /** nullable — 위치 미등록 회의실은 `null`. */
  location: string | null;
  availableFrom: string;
  availableTo: string;
}

export function toMeetingRoom(be: BeMeetingRoom): MeetingRoom {
  return {
    id: String(be.meetingRoomId),
    name: be.name,
    location: be.location ?? "",
    openTime: be.availableFrom,
    closeTime: be.availableTo,
  };
}

/**
 * 주간 예약 현황(`GET /api/meeting-rooms/availability`, ROOM-02) 안의 회의실 사본 — `location`이
 * 없다(BE가 이 엔드포인트에서는 안 내려준다).
 */
export interface BeRoomAvailabilityMeetingRoom {
  meetingRoomId: number;
  name: string;
  availableFrom: string;
  availableTo: string;
}

export interface BeRoomAvailabilitySlot {
  startTime: string;
  status: RoomSlotStatus;
  meetingId: number | null;
  title: string | null;
}

export interface BeRoomDayAvailability {
  date: string;
  dayOfWeek: string;
  slots: BeRoomAvailabilitySlot[];
}

export interface BeRoomWeekAvailability {
  weekStart: string;
  weekEnd: string;
  slotMinutes: number;
  meetingRoom: BeRoomAvailabilityMeetingRoom;
  days: BeRoomDayAvailability[];
}

export function toRoomWeekAvailability(be: BeRoomWeekAvailability): RoomWeekAvailability {
  return {
    weekStart: be.weekStart,
    slotMinutes: be.slotMinutes,
    meetingRoom: {
      id: String(be.meetingRoom.meetingRoomId),
      name: be.meetingRoom.name,
      location: "",
      openTime: be.meetingRoom.availableFrom,
      closeTime: be.meetingRoom.availableTo,
    },
    days: be.days.map((day) => ({
      date: day.date,
      slots: day.slots.map((slot) => ({
        startTime: slot.startTime,
        status: slot.status,
        meetingId: slot.meetingId !== null ? String(slot.meetingId) : null,
        title: slot.title,
      })),
    })),
  };
}

/**
 * 하루치 RESERVED 슬롯을 연속 구간으로 병합해 캘린더 막대로 만든다. 같은 `meetingId`가 슬롯
 * 간격 없이 이어질 때만 한 막대로 합친다 — 예약은 보통 30분 고정이지만, 이 API는 다른 경로로
 * 생성된 더 긴 회의도 그대로 반영해야 해서 병합이 필요하다.
 */
function toDayCalendarEvents(day: RoomDayAvailability, slotMinutes: number): RoomCalendarEvent[] {
  const events: RoomCalendarEvent[] = [];
  let current: { meetingId: string; title: string; start: Date; end: Date } | null = null;

  const flush = () => {
    if (!current) return;
    events.push({
      id: current.meetingId,
      title: current.title,
      start: current.start,
      end: current.end,
    });
    current = null;
  };

  for (const slot of day.slots) {
    const start = new Date(`${day.date}T${slot.startTime}:00`);
    const end = new Date(start.getTime() + slotMinutes * 60_000);

    if (slot.status === "RESERVED" && slot.meetingId !== null) {
      if (
        current &&
        current.meetingId === slot.meetingId &&
        current.end.getTime() === start.getTime()
      ) {
        current.end = end;
      } else {
        flush();
        current = { meetingId: slot.meetingId, title: slot.title ?? "", start, end };
      }
    } else {
      flush();
    }
  }
  flush();

  return events;
}

export function toRoomCalendarEvents(week: RoomWeekAvailability): RoomCalendarEvent[] {
  return week.days.flatMap((day) => toDayCalendarEvents(day, week.slotMinutes));
}

/** `POST /api/meeting-rooms`(ROOM-03) 요청 본문 — 폼 입력(`openTime`·`closeTime`)을 BE 필드명으로 바꾼다. */
export interface BeCreateMeetingRoomPayload {
  name: string;
  location: string | null;
  availableFrom: string;
  availableTo: string;
}

export function toCreateMeetingRoomPayload(draft: MeetingRoomDraft): BeCreateMeetingRoomPayload {
  const location = draft.location.trim();
  return {
    name: draft.name.trim(),
    location: location.length > 0 ? location : null,
    availableFrom: draft.openTime,
    availableTo: draft.closeTime,
  };
}

/** `POST /api/meeting-rooms` 성공 응답 — 생성된 id만 내려준다(나머지 필드는 요청값 그대로다). */
export interface BeCreateMeetingRoomResponse {
  meetingRoomId: number;
}

/** 응답의 id와 방금 보낸 폼 입력을 합쳐 화면이 바로 얹을 수 있는 `MeetingRoom`을 만든다. */
export function toCreatedMeetingRoom(meetingRoomId: number, draft: MeetingRoomDraft): MeetingRoom {
  return {
    id: String(meetingRoomId),
    name: draft.name.trim(),
    location: draft.location.trim(),
    openTime: draft.openTime,
    closeTime: draft.closeTime,
  };
}

/**
 * `POST /api/meetings`(MEET-01) 요청 본문 — "회의실 예약 = 회의 개설"이 한 동작이라
 * (WORKFLOW.md §3-1) 예약 드래프트를 회의 계약 필드명으로 바꾼다.
 * ⚠️ `recordingConsent`: 팀 확정 예약 모달(WORKFLOW.md §3-1)에 이 필드를 받는 입력이 없다 —
 *    화면에 없는 값을 지어내지 않고 계약의 기본값(`false`)을 그대로 보낸다.
 * ⚠️ `relatedActionId`: 계약엔 이 이름뿐이지만 팀 확정 스펙의 "상위 팀 액션"과 같은 개념으로
 *    보고 `parentTeamActionId`를 여기에 싣는다(사용자 확인 완료, 2026-08-12) — Owner 개설
 *    회의는 이 값이 없어 `undefined`로 빠진다.
 * ⚠️ 종료 시각은 폼에서 안 받는다 — 예약은 **30분 한 타임 고정**이라(팀 확정) 시작 시각 +
 *    고정 길이로 계산한 값을 그대로 보낸다(FE에서 길이를 입력받지 않을 뿐, 계약이 요구하는
 *    `endAt` 자체는 보낸다).
 */
export interface BeCreateMeetingPayload {
  title: string;
  projectId: number;
  meetingRoomId: number;
  startAt: string;
  endAt: string;
  recordingConsent: boolean;
  relatedActionId?: number;
  attendeeMemberIds: number[];
}

function toLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function toCreateMeetingPayload(
  draft: RoomReservationDraft,
  range: { start: Date; end: Date },
): BeCreateMeetingPayload {
  return {
    title: draft.title.trim(),
    projectId: Number(draft.projectId),
    meetingRoomId: Number(draft.roomId),
    startAt: toLocalDateTime(range.start),
    endAt: toLocalDateTime(range.end),
    recordingConsent: false,
    relatedActionId: draft.parentTeamActionId,
    attendeeMemberIds: draft.attendeeIds,
  };
}

/**
 * `POST /api/meetings` 성공 응답 — [확인] MEET-01 계약(2026-08-12) 기준, BE 실코드는 아직
 * 대조 전이다(§연동 검증). `meetingRoom`·`host`·`attendees`의 내부 모양은 계약에 명시가 없어
 * 추측해서 매핑하지 않는다 — 화면에는 방금 제출한 값(`draft`)과 `meetingId`만 반영한다.
 */
export interface BeCreateMeetingResponse {
  meetingId: number;
  status: string;
  title: string;
  startAt: string;
  endAt: string;
  recordingConsent: boolean;
}

/**
 * 응답의 `meetingId`와 방금 보낸 폼 입력을 합쳐 캘린더가 바로 얹을 수 있는 `RoomReservation`을
 * 만든다(`toCreatedMeetingRoom`과 같은 비관적 갱신 방식).
 * ⚠️ `roomName`: 실 API 모드에서는 `getMeetingRooms()`(ROOM-01, 연동 완료)로 찾은 이름을
 *    호출부가 넘긴다.
 * ⚠️ `projectTag`: 예약 폼의 "프로젝트" select용 실 API(`getReservableProjects`)가 아직
 *    미연동이라(다른 이슈) 지금은 빈 문자열로 둔다 — 그 API가 연동되면 호출부만 고치면 된다.
 *    `revalidatePath` 뒤 캘린더 재조회(ROOM-02, 연동 완료)에는 정확한 값이 나온다.
 */
export function toReservationFromCreatedMeeting(
  response: BeCreateMeetingResponse,
  draft: RoomReservationDraft,
  range: { start: Date; end: Date },
  context: { roomName: string; projectTag: string; ownerId: number },
): RoomReservation {
  return {
    id: String(response.meetingId),
    title: draft.title.trim(),
    start: range.start,
    end: range.end,
    roomId: draft.roomId,
    roomName: context.roomName,
    projectId: draft.projectId,
    projectTag: context.projectTag,
    topics: draft.topics.map((topic) => ({ main: topic.main.trim(), sub: topic.sub.trim() })),
    attendeeIds: draft.attendeeIds,
    ownerId: context.ownerId,
  };
}

/** 방금 만든 예약(`createRoomReservationAction`의 반환값)을 캘린더 막대 모양으로 맞춘다. */
export function toCalendarEventFromReservation(reservation: RoomReservation): RoomCalendarEvent {
  return {
    id: reservation.id,
    title: reservation.title,
    start: reservation.start,
    end: reservation.end,
    attendeeIds: reservation.attendeeIds,
    projectTag: reservation.projectTag,
  };
}
