import { addDays, format, parse } from "date-fns";
import { ko } from "date-fns/locale";

import { ROOM_OPERATING_END_MINUTES, ROOM_OPERATING_START_MINUTES } from "./constants";
import { SLOT_MINUTES } from "./grid-slot";

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
 * 예약 모달의 "시작 시간" 선택지 — 회의실 운영 시간(09:00~18:00, `constants.ts`)의 30분 단위뿐이다
 * (2026-08-14 — 전엔 캘린더 격자 전체(`grid-slot.ts`의 00:00~24:00)를 그대로 썼다).
 * ⚠️ 격자(`GRID_START_HOUR`~`GRID_END_HOUR`)는 **보여주는 범위**이고, 여기는 **고를 수 있는
 *    범위**다 — 서로 다른 값이다. 격자 전체를 선택지로 뒀던 이유(운영 시간 밖 칸을 클릭해도
 *    선택값이 빈칸처럼 안 보이게)는, 이제 그런 칸 클릭 자체를 `handleGridClick`
 *    (`weekly-room-calendar.tsx`)이 무시해 더 이상 생기지 않는다. 운영 시간 밖 값을 뽑을 수
 *    있으면 제출 시 `validateRoomReservationDraft`가 뒤늦게 막는 오류만 늘어난다.
 */
export function buildStartTimeOptions(): string[] {
  const options: string[] = [];
  for (
    let minutes = ROOM_OPERATING_START_MINUTES;
    minutes < ROOM_OPERATING_END_MINUTES;
    minutes += SLOT_MINUTES
  ) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    options.push(`${hour}:${minute}`);
  }
  return options;
}
