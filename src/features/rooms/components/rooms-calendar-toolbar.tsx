import { addDays, format, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ToolbarProps } from "react-big-calendar";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { MeetingRoom, RoomReservation } from "../types";

export const ALL_ROOMS_VALUE = "all";

interface RoomsCalendarToolbarProps extends ToolbarProps<RoomReservation> {
  rooms: MeetingRoom[];
  /** `ALL_ROOMS_VALUE` = 전체 회의실. */
  selectedRoomId: string;
  onSelectedRoomChange: (roomId: string) => void;
  /** "예약하기"(2026-08-10 이전엔 캘린더 위 별도 버튼) — `오늘` 버튼 옆으로 이동. */
  onAddClick: () => void;
}

/**
 * 커스텀 툴바 — 왼쪽에 `<` 이번 주 구간(월~금) `>` + 회의실 거르개, 오른쪽에 `오늘`·`회의 추가`.
 * ⚠️ RBC가 주는 `label`(로케일이 안 먹어 영문으로 나온다) 대신 `date`로 직접 만든다
 *    (`calendar-toolbar.tsx`와 같은 이유, CLAUDE.md §카피: 날짜는 한글로).
 * ⚠️ 구간 라벨에 **고정 너비**를 준다 — 월이 걸치면 자릿수가 달라져 다음 주 버튼 위치가 흔들린다.
 * ⚠️ 회의실 거르개는 **화면 표시만 거른다** — `weekly-room-calendar.tsx`가 `reservations`를
 *    `selectedRoomId`로 걸러 `Calendar`에 넘긴다(서버 재조회 없음, 이미 그 주 예약을 다 갖고 있다).
 */
export function RoomsCalendarToolbar({
  date,
  onNavigate,
  rooms,
  selectedRoomId,
  onSelectedRoomChange,
  onAddClick,
}: RoomsCalendarToolbarProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 4);
  const rangeLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${format(weekStart, "M월 d일", { locale: ko })} - ${format(weekEnd, "d일", { locale: ko })}`
      : `${format(weekStart, "M월 d일", { locale: ko })} - ${format(weekEnd, "M월 d일", { locale: ko })}`;

  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="지난 주"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft />
        </Button>
        <p className="w-40 shrink-0 text-center text-base font-semibold tabular-nums">
          {rangeLabel}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="다음 주"
          onClick={() => onNavigate("NEXT")}
        >
          <ChevronRight />
        </Button>

        <Select
          value={selectedRoomId}
          onValueChange={(value) => onSelectedRoomChange(value ?? ALL_ROOMS_VALUE)}
        >
          <SelectTrigger size="sm" aria-label="회의실 필터">
            <SelectValue placeholder="전체 회의실" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROOMS_VALUE}>전체 회의실</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          오늘
        </Button>
        <Button type="button" size="sm" variant="ink" onClick={onAddClick}>
          <Plus aria-hidden />
          회의 추가
        </Button>
      </div>
    </div>
  );
}
