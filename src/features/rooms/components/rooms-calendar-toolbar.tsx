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

import { ROOMS_CALENDAR_TOOLBAR_LABEL } from "../constants";
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
 * 주의: RBC가 주는 `label`(로케일이 안 먹어 영문으로 나온다) 대신 `date`로 직접 만든다
 *    (`calendar-toolbar.tsx`와 같은 이유, CLAUDE.md §카피: 날짜는 한글로).
 * 주의: 구간 라벨은 좁은 화면에서 줄어들 수 있다 — 자릿수가 달라져도 `tabular-nums`로 숫자
 *    폭만 맞춘다(고정 폭 대신 `max-w`로 최소 여백만 보장).
 * 주의: 회의실 거르개는 **화면 표시만 거른다** — `weekly-room-calendar.tsx`가 `reservations`를
 *    `selectedRoomId`로 걸러 `Calendar`에 넘긴다(서버 재조회 없음, 이미 그 주 예약을 다 갖고 있다).
 * 주의: 좁은 화면에서는 두 그룹(날짜 탐색+거르개 / 오늘+회의 추가)을 세로로 쌓는다 — 가로로
 *    욱여넣으면 회의 추가 버튼이 화면 밖으로 밀려난다.
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
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="지난 주"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft />
        </Button>
        <p className="max-w-28 shrink-0 truncate text-center text-base font-semibold tabular-nums sm:max-w-40">
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
          // ⚠️ `items`를 넘긴다 — 안 넘기면 트리거가 닫혀 있는 동안은 라벨을 못 찾아
          //    원문 값(`room.id`)이 그대로 보인다(`search-filter-bar.tsx`와 같은 이유).
          items={{
            [ALL_ROOMS_VALUE]: ROOMS_CALENDAR_TOOLBAR_LABEL.allRooms,
            ...Object.fromEntries(rooms.map((room) => [room.id, room.name])),
          }}
          value={selectedRoomId}
          onValueChange={(value) => onSelectedRoomChange(value ?? ALL_ROOMS_VALUE)}
        >
          <SelectTrigger size="sm" aria-label={ROOMS_CALENDAR_TOOLBAR_LABEL.roomFilter}>
            <SelectValue placeholder={ROOMS_CALENDAR_TOOLBAR_LABEL.allRooms} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROOMS_VALUE}>{ROOMS_CALENDAR_TOOLBAR_LABEL.allRooms}</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          오늘
        </Button>
        <Button type="button" size="sm" variant="ink" onClick={onAddClick}>
          <Plus aria-hidden />
          {ROOMS_CALENDAR_TOOLBAR_LABEL.addMeeting}
        </Button>
      </div>
    </div>
  );
}
