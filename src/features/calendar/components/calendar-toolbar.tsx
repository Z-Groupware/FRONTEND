import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ToolbarProps } from "react-big-calendar";

import { Button } from "@/components/ui/button";

import type { PersonalCalendarEvent } from "../types";
import { CalendarLegend } from "./calendar-legend";

/**
 * 커스텀 툴바 — 좌/중앙/우 3등분(`flex-1` 균등폭)이라 가운데 라벨이 항상 전체 폭의
 * 정중앙(월간뷰 7칸 중 4번째 칸, 즉 수요일 칸 위)에 온다. 오른쪽엔 색상 범례를 붙인다.
 */
export function CalendarToolbar({ label, onNavigate }: ToolbarProps<PersonalCalendarEvent>) {
  return (
    <div className="mb-3 flex items-center">
      <div className="flex flex-1 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="이전 달"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          오늘
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="다음 달"
          onClick={() => onNavigate("NEXT")}
        >
          <ChevronRight />
        </Button>
      </div>

      <p className="flex-1 text-center text-base font-semibold">{label}</p>

      <div className="flex flex-1 justify-end">
        <CalendarLegend />
      </div>
    </div>
  );
}
