import { addDays, format, parse } from "date-fns";
import { ko } from "date-fns/locale";

import { GRID_END_HOUR, GRID_START_HOUR, SLOT_MINUTES } from "./grid-slot";

export interface SlotOption {
  value: string;
  label: string;
}

/**
 * 예약 모달의 "요일" 선택지 — 이 주(`week`, 월요일)의 월~금 다섯 날짜뿐이다.
 * ⚠️ 목록 자체에 주말이 없다 — 주말 선택을 서버 검증이 아니라 **고를 수 있는 값 자체를 없애서** 막는다.
 */
export function buildWeekdayOptions(week: string): SlotOption[] {
  const monday = parse(week, "yyyy-MM-dd", new Date());
  return Array.from({ length: 5 }, (_, index) => {
    const date = addDays(monday, index);
    return { value: format(date, "yyyy-MM-dd"), label: format(date, "EEE M/d", { locale: ko }) };
  });
}

/**
 * 예약 모달의 "시작 시간" 선택지 — 캘린더 격자와 같은 30분 단위 전체(`grid-slot.ts`가 정본).
 * ⚠️ 회의실 운영 시간(09:00~18:00)으로 미리 좁히지 않는다 — 격자에서 그 밖의 칸을 클릭해
 *    모달이 열려도 고른 시각이 이 목록에 없어 선택값이 빈칸처럼 보이는 걸 막는다. 운영 시간
 *    제한은 그대로 제출 시 `validateRoomReservationDraft`가 본다.
 */
export function buildStartTimeOptions(): string[] {
  const options: string[] = [];
  for (let minutes = GRID_START_HOUR * 60; minutes < GRID_END_HOUR * 60; minutes += SLOT_MINUTES) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    options.push(`${hour}:${minute}`);
  }
  return options;
}
