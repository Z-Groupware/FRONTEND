"use client";

import { addMinutes, format, parse } from "date-fns";
import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RESERVATION_DURATION_MINUTES } from "../constants";
import { buildStartTimeOptions, buildWeekdayOptions } from "../slot-options";

interface SlotPickerProps {
  /** "YYYY-MM-DD" — 이 주의 월요일. 요일 선택지(월~금)를 여기서 뽑는다. */
  week: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  startTime: string;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
}

/**
 * 예약 모달 상단 — 요일·시작 시간을 고른다(2026-08-14, 읽기 전용 요약 `SlotSummary`에서
 * 편집 가능한 선택지로 바뀜).
 * ⚠️ **요일은 이 주의 월~금 다섯 개뿐이다** — 주말은 선택지에 없어 고를 수 자체가 없다.
 * ⚠️ **시간은 30분 단위 고정이다** — 예약은 30분 한 타임(CLAUDE.md §브라우저 API, 팀 확정)이라
 *    1시간 등 다른 단위 선택지를 두지 않는다.
 */
export function SlotPicker({
  week,
  date,
  startTime,
  onDateChange,
  onStartTimeChange,
}: SlotPickerProps) {
  const weekdayOptions = useMemo(() => buildWeekdayOptions(week), [week]);
  const startTimeOptions = useMemo(() => buildStartTimeOptions(), []);

  /*
    ⚠️ `useMemo`로 참조를 고정한다 — 안 그러면 base-ui `Select`의 내부 이펙트가 매 렌더 새
       객체를 참조 변화로 읽어 "Maximum update depth exceeded"로 이어진다
       (`room-reservation-fields.tsx`가 같은 이유로 쓰는 패턴).
  */
  const weekdayItems = useMemo(
    () => Object.fromEntries(weekdayOptions.map((option) => [option.value, option.label])),
    [weekdayOptions],
  );
  const startTimeItems = useMemo(
    () => Object.fromEntries(startTimeOptions.map((time) => [time, time])),
    [startTimeOptions],
  );

  const slotEnd =
    date && startTime
      ? format(
          addMinutes(
            parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date()),
            RESERVATION_DURATION_MINUTES,
          ),
          "HH:mm",
        )
      : null;

  return (
    <div className="border-border bg-secondary/50 flex flex-wrap items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[13px]">
      <Select
        items={weekdayItems}
        value={date}
        onValueChange={(value) => value && onDateChange(value)}
      >
        <SelectTrigger size="sm" aria-label="예약 요일" className="w-[104px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {weekdayOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={startTimeItems}
        value={startTime}
        onValueChange={(value) => value && onStartTimeChange(value)}
      >
        <SelectTrigger size="sm" aria-label="예약 시작 시간" className="w-[88px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {startTimeOptions.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {slotEnd && <span className="text-muted-foreground tabular-nums">~ {slotEnd}</span>}

      <span className="text-border" aria-hidden>
        |
      </span>
      <span className="text-muted-foreground">{RESERVATION_DURATION_MINUTES}분 · 즉시 확정</span>
    </div>
  );
}
