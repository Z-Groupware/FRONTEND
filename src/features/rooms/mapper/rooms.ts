/**
 * 회의실 CRUD(ROOM-01·03·04) BE shape → UI 계약.
 * [확인] 회의실 도메인 문서(ROOM-01~05, 2026-08-12) 기준 — BE 실코드는 아직 대조 전이다
 *   (§연동 검증: Swagger·구두 추측 금지, 문서와 코드가 다르면 코드가 맞다 — 구현 시 컨트롤러로 재확인).
 */

import type { MeetingRoom, MeetingRoomDraft } from "../types";

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
