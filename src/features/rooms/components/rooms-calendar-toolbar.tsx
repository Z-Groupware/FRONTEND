import { addDays, format, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ToolbarProps } from "react-big-calendar";

import { Button } from "@/components/ui/button";

import type { RoomReservation } from "../types";

/**
 * 커스텀 툴바 — 왼쪽에 `<` 이번 주 구간(월~금) `>`을 그린다.
 * ⚠️ RBC가 주는 `label`(로케일이 안 먹어 영문으로 나온다) 대신 `date`로 직접 만든다
 *    (`calendar-toolbar.tsx`와 같은 이유, CLAUDE.md §카피: 날짜는 한글로).
 * ⚠️ 구간 라벨에 **고정 너비**를 준다 — 월이 걸치면 자릿수가 달라져 다음 주 버튼 위치가 흔들린다.
 */
export function RoomsCalendarToolbar({ date, onNavigate }: ToolbarProps<RoomReservation>) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 4);
  const rangeLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${format(weekStart, "M월 d일", { locale: ko })} - ${format(weekEnd, "d일", { locale: ko })}`
      : `${format(weekStart, "M월 d일", { locale: ko })} - ${format(weekEnd, "M월 d일", { locale: ko })}`;

  return (
    <div className="mb-3 flex items-center justify-between">
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
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
        오늘
      </Button>
    </div>
  );
}
