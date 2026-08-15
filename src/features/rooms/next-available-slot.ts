import {
  RESERVATION_DURATION_MINUTES,
  ROOM_OPERATING_END_MINUTES,
  ROOM_OPERATING_START_MINUTES,
} from "./constants";

/**
 * 우측 상단 "예약하기" 버튼이 여는 기본 슬롯 — 지금 시각을 30분 단위로 올려 잡는다.
 * ⚠️ 회의실·요일별 예약 현황은 안 본다 — 그건 예약 모달을 연 뒤 캘린더에서 이미 확인할 수 있고,
 *    이 계산은 "언제 열지"만 정한다(어느 회의실인지는 모달에서 고른다). 이제 이 값은 **초기
 *    제안**일 뿐이다 — 모달이 직접 고를 수 있는 날짜·시간 피커를 열어 준다(2026-08-14).
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
