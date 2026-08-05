import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { ToolbarProps } from "react-big-calendar";

import { Button } from "@/components/ui/button";

import type { PersonalCalendarEvent } from "../types";
import { CalendarLegend } from "./calendar-legend";

interface CalendarToolbarProps extends ToolbarProps<PersonalCalendarEvent> {
  /** 범례 옆, 툴바 오른쪽 끝에 같은 줄로 붙는 액션(예: Todo 추가 버튼). */
  action?: ReactNode;
}

/** 커스텀 툴바 — 왼쪽에 `<` 라벨 `>`을 붙여 그리고, 오른쪽 끝엔 범례+액션을 한 줄로 둔다. */
export function CalendarToolbar({ label, onNavigate, action }: CalendarToolbarProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="이전 달"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft />
        </Button>
        <p className="text-base font-semibold">{label}</p>
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

      <div className="flex items-center gap-4">
        <CalendarLegend />
        {action}
      </div>
    </div>
  );
}
