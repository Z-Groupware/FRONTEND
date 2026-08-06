import { isValid, parse } from "date-fns";

import { MEETING_TOPIC_SUB, type MeetingTopicMain } from "@/constants/meeting";

import type { RoomReservationDraft, RoomReservationFormErrors } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):(00|30)$/;

/** 예약 길이 — 팀 확정: 30분 한 타임, 연장하지 않는다(CLAUDE.md §브라우저 API). */
export const RESERVATION_DURATION_MINUTES = 30;

const OPERATING_START_MINUTES = 9 * 60;
const OPERATING_END_MINUTES = 18 * 60;

function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  return isValid(parse(value, "yyyy-MM-dd", new Date()));
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

/**
 * 회의실 예약 폼 검증 — 화면(모달)과 서버(Server Action)가 **이 함수 하나**로 본다.
 * ⚠️ 같은 회의실·시간대 중복 여부는 여기서 보지 않는다 — 그건 기존 예약 목록이 있어야 판단할 수
 *    있어 `actions.ts`가 목/실서버 조회 뒤에 따로 확인한다.
 */
export function validateRoomReservationDraft(
  draft: RoomReservationDraft,
): RoomReservationFormErrors {
  const errors: RoomReservationFormErrors = {};

  if (!draft.title.trim()) errors.title = "회의 제목을 입력해 주세요";
  if (!draft.roomId.trim()) errors.roomId = "회의실을 선택해 주세요";

  if (!draft.date.trim()) errors.date = "날짜를 선택해 주세요";
  else if (!isValidCalendarDate(draft.date)) errors.date = "올바른 날짜가 아니에요";

  if (!draft.startTime.trim()) {
    errors.startTime = "시작 시간을 선택해 주세요";
  } else if (!TIME_PATTERN.test(draft.startTime)) {
    errors.startTime = "예약은 30분 단위로만 가능해요";
  } else {
    const startMinutes = toMinutes(draft.startTime);
    if (
      startMinutes < OPERATING_START_MINUTES ||
      startMinutes + RESERVATION_DURATION_MINUTES > OPERATING_END_MINUTES
    ) {
      errors.startTime = "회의실 운영 시간(09:00~18:00) 안에서 선택해 주세요";
    }
  }

  // ⚠️ 프로젝트는 선택값이다 — "팀 위클리 싱크"처럼 프로젝트에 안 묶인 예약도 있다
  //    (types.ts의 RoomReservation.projectId, mock/reservations.ts 시드가 이미 그렇다).
  if (!draft.topicMain.trim()) errors.topicMain = "대주제를 선택해 주세요";
  if (!draft.topicSub.trim()) errors.topicSub = "소주제를 선택해 주세요";
  else if (draft.topicMain.trim()) {
    const validSubs = MEETING_TOPIC_SUB[draft.topicMain as MeetingTopicMain];
    if (!validSubs?.some((sub) => sub.value === draft.topicSub)) {
      errors.topicSub = "대주제와 맞지 않는 소주제예요";
    }
  }

  if (draft.attendeeIds.length === 0) {
    errors.attendeeIds = "참석자를 한 명 이상 선택해 주세요";
  } else if (draft.attendeeIds.some((id) => !Number.isInteger(id))) {
    errors.attendeeIds = "참석자 값이 올바르지 않아요";
  }

  return errors;
}
