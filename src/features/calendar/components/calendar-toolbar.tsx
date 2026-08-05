import { format } from "date-fns";
import { ko } from "date-fns/locale";
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

/**
 * 커스텀 툴바 — 왼쪽에 `<` 라벨 `>`을 붙여 그리고, 오른쪽 끝엔 범례+액션을 한 줄로 둔다.
 * ⚠️ 라벨은 RBC가 주는 `label`(로케일 연결이 안 돼 "September 2026"처럼 영문으로 나온다) 대신
 *    `date`로 직접 "2026년 9월" 꼴을 만든다(CLAUDE.md §카피: 날짜는 한글로).
 * ⚠️ 라벨에 **고정 너비**를 준다 — "9월"·"12월"처럼 글자수가 달라지면 라벨 폭이 흔들려서
 *    바로 옆 다음 달 버튼(`>`) 위치가 매번 바뀐다. 연속으로 눌러도 버튼이 같은 자리에 있어야 한다.
 */
export function CalendarToolbar({ date, onNavigate, action }: CalendarToolbarProps) {
  const monthLabel = format(date, "yyyy년 M월", { locale: ko });

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
        <p className="w-28 text-center text-base font-semibold tabular-nums">{monthLabel}</p>
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
