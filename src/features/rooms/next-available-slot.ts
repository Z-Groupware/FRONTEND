import { format, parse, startOfWeek } from "date-fns";

import {
  RESERVATION_DURATION_MINUTES,
  ROOM_OPERATING_END_MINUTES,
  ROOM_OPERATING_START_MINUTES,
} from "./constants";

/**
 * 우측 상단 "예약하기" 버튼이 여는 기본 슬롯 — 지금 시각을 30분 단위로 올려 잡는다.
 * ⚠️ 회의실·요일별 예약 현황은 안 본다 — 그건 예약 모달을 연 뒤 캘린더에서 이미 확인할 수 있고,
 *    이 계산은 "언제 열지"만 정한다(어느 회의실인지는 모달에서 고른다).
 * ⚠️ 운영 시간(09:00~18:00) 밖이면 다음 날 09:00으로 넘긴다 — `validateRoomReservationDraft`가
 *    막는 값을 미리 열어주지 않는다.
 */
export function getNextAvailableSlot(now: Date): Date {
  const slot = new Date(now);
  slot.setSeconds(0, 0);

  const remainder = slot.getMinutes() % RESERVATION_DURATION_MINUTES;
  if (remainder !== 0) {
    slot.setMinutes(slot.getMinutes() + (RESERVATION_DURATION_MINUTES - remainder));
  }

  const dayMinutes = slot.getHours() * 60 + slot.getMinutes();
  if (dayMinutes < ROOM_OPERATING_START_MINUTES) {
    setTimeOfDay(slot, ROOM_OPERATING_START_MINUTES);
  } else if (dayMinutes + RESERVATION_DURATION_MINUTES > ROOM_OPERATING_END_MINUTES) {
    slot.setDate(slot.getDate() + 1);
    setTimeOfDay(slot, ROOM_OPERATING_START_MINUTES);
  }

  return slot;
}

function setTimeOfDay(date: Date, minutesFromMidnight: number): void {
  date.setHours(Math.floor(minutesFromMidnight / 60), minutesFromMidnight % 60, 0, 0);
}

/**
 * "회의 추가" 버튼이 여는 기본 슬롯 — **지금 보고 있는 주(`week`) 기준**으로 잡는다.
 *
 * ⚠️ `getNextAvailableSlot(new Date())`만 쓰면 "지금"이 항상 이번 주 날짜라, 캘린더가
 *    다른 주를 보여주는 중이면 그 날짜가 `SlotPicker`의 요일 선택지(이 주의 월~금,
 *    `buildWeekdayOptions`)에 없어 `form.date`가 선택지 밖 값이 된다.
 * ⚠️ 보고 있는 주가 이번 주면 `getNextAvailableSlot`과 똑같이 "지금"을 30분 단위로 올려 쓰고,
 *    다른 주면 "지금"이라는 개념이 없으니 그 주 월요일 운영 시작 시각(09:00)으로 연다.
 */
export function getDefaultSlotForWeek(week: string, now: Date): Date {
  const displayedMonday = parse(week, "yyyy-MM-dd", now);
  const currentWeek = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  if (week === currentWeek) {
    return getNextAvailableSlot(now);
  }

  const slot = new Date(displayedMonday);
  setTimeOfDay(slot, ROOM_OPERATING_START_MINUTES);
  return slot;
}
