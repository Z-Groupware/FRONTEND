"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { CALENDAR_TAG_BG, CALENDAR_TAG_FG, calendarStatusDotColor } from "../tag-colors";
import type { PersonalCalendarEvent } from "../types";

/**
 * 월간 격자 — **직접 그린다.**
 *
 * ⚠️ `react-big-calendar`를 쓰다 걷어냈다(2026-08-08). 월 뷰가 일정을 **주 단위 행**에
 *    가로로 겹쳐 배치해서, 하루가 넘칠 때 **그 날만 스크롤**시킬 DOM이 아예 없었다 —
 *    라이브러리 CSS를 이기려고 덧댄 것들(붙박이 날짜 줄, 선택 색 되받기)도 서로 부딪혀
 *    격자가 어긋나고 드래그하면 칸이 밀렸다. 개인 캘린더는 **하루짜리 항목만** 다루므로
 *    격자를 직접 그리는 편이 단순하고, 하루 칸이 곧 스크롤 상자가 된다.
 * ⚠️ 회의실 주간 달력은 아직 그 라이브러리를 쓴다 — 의존성은 남는다.
 * ⚠️ **오늘은 마운트한 뒤에 켠다.** `new Date()`를 렌더 중에 부르면 서버(대개 UTC)와
 *    브라우저(KST)의 날짜가 갈리는 순간 하이드레이션이 어긋난다 — 자정 무렵엔 실제로 갈린다.
 *    첫 프레임엔 테두리 원이 없다가 바로 붙는데, 한 프레임이라 눈에 안 띈다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const DAY_KEY = "yyyy-MM-dd";

/**
 * "오늘"을 **브라우저 기준으로** 잡는다 — 서버 렌더에서는 `null`이다.
 *
 * ⚠️ 렌더 중에 `new Date()`를 부르면 서버(대개 UTC)와 브라우저(KST)의 날짜가 갈리는 순간
 *    하이드레이션이 어긋난다 — 자정 무렵엔 실제로 갈린다. 그래서 서버 스냅샷은 `null`로 두고
 *    브라우저에서만 값이 온다. 첫 프레임엔 테두리 원이 없다가 바로 붙는데, 한 프레임이라
 *    눈에 안 띈다.
 * ⚠️ `Date`가 아니라 **날짜 문자열**을 돌려준다. `useSyncExternalStore`의 스냅샷은 값이 같으면
 *    같아야 하는데, `new Date()`는 부를 때마다 새 참조라 무한 렌더가 된다.
 * ⚠️ 구독은 빈 함수다 — 화면을 보는 동안 날짜가 바뀌는 일(자정)까지는 챙기지 않는다.
 */
function useTodayKey(): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => format(new Date(), DAY_KEY),
    () => null,
  );
}

interface MonthGridProps {
  /** 이 달에 속한 항목들 — 걸러 내는 일은 서버가 한다 */
  events: PersonalCalendarEvent[];
  /** 지금 보고 있는 달의 아무 날 */
  month: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function MonthGrid({ events, month, selectedDate, onSelectDate }: MonthGridProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { locale: ko }),
    end: endOfWeek(endOfMonth(month), { locale: ko }),
  });

  const todayKey = useTodayKey();
  const weekCount = days.length / 7;

  return (
    <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      {/* 요일 머리 — 띠로 칠하지 않고 선 하나로만 가른다(DESIGN §5 표면) */}
      <div className="border-border grid shrink-0 grid-cols-7 border-b">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="text-muted-foreground py-2.5 text-center text-[11px] leading-4 font-medium"
          >
            {label}
          </div>
        ))}
      </div>

      {/*
        ⚠️ **남는 높이를 주(週)들이 똑같이 나눠 갖는다**(`grid-rows-*` + `flex-1`). 달마다 5주·6주로
           갈리지만 격자 전체 높이는 그대로라, 달을 넘겨도 카드가 커졌다 작아지지 않는다.
      */}
      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: weekCount }, (_, week) => (
          <div key={week} className="border-border grid grid-cols-7 not-first:border-t">
            {days.slice(week * 7, week * 7 + 7).map((day) => (
              <DayCell
                key={day.toISOString()}
                day={day}
                events={events.filter((event) => isSameDay(event.start, day))}
                isOutside={!isSameMonth(day, month)}
                isToday={format(day, DAY_KEY) === todayKey}
                isSelected={isSameDay(day, selectedDate)}
                onSelect={onSelectDate}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 하루 칸.
 *
 * ⚠️ **일정이 많으면 이 칸 안에서 스크롤한다.** 라이브러리를 걷어낸 가장 큰 이유다 —
 *    넘치는 일정이 말없이 잘리지 않는다(§정직성).
 * ⚠️ 날짜 숫자는 **붙박이**다. 아래 목록만 흐른다.
 */
function DayCell({
  day,
  events,
  isOutside,
  isToday,
  isSelected,
  onSelect,
}: {
  day: Date;
  events: PersonalCalendarEvent[];
  isOutside: boolean;
  isToday: boolean;
  isSelected: boolean;
  onSelect: (date: Date) => void;
}) {
  return (
    /*
      ⚠️ 칸 전체가 **버튼**이다 — 빈 곳을 눌러도 그날이 골라져야 한다. 키보드로도 짚을 수
         있어야 해서 `div`가 아니라 `button`이다(§a11y: 클릭은 button/a).
    */
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-pressed={isSelected}
      /*
        ⚠️ **일정 수까지 이름에 넣는다.** `aria-label`은 자식 텍스트를 통째로 덮어써서,
           날짜만 적어 두면 스크린리더에는 "8월 5일(수) 버튼"만 읽히고 그 칸에 일정이
           있다는 사실 자체가 사라진다 — 눈으로는 칩이 보이는데 귀로는 빈 칸이다.
        ⚠️ 제목까지 다 읽지는 않는다. 칸을 훑는 단계에서는 **있다/없다와 몇 건**이면 되고,
           제목·상태는 그 날을 고르면 오른쪽 일정 카드가 목록으로 읽어 준다.
      */
      aria-label={
        events.length > 0
          ? `${format(day, "M월 d일(EEE)", { locale: ko })}, 일정 ${events.length}건`
          : format(day, "M월 d일(EEE)", { locale: ko })
      }
      className={cn(
        "focus-visible:ring-ring relative flex min-w-0 flex-col overflow-hidden text-left transition-colors not-first:border-l",
        "border-border focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-hidden",
        /*
          ⚠️ **고른 칸을 회색으로 칠하지 않는다.** 칸이 통째로 어두워지면 그 안의 칩까지 눌려
             보이고, 달력에 회색 덩어리가 하나 생긴다 — 고른 날은 **숫자의 채운 원**이 말한다.
        */
        "hover:bg-foreground/[0.02]",
      )}
    >
      <div className="flex shrink-0 justify-end px-2 pt-1.5 pb-1">
        {/*
          아이폰 달력과 같은 문법 — **오늘은 테두리 원, 고른 날은 채운 원.**
          ⚠️ 오늘을 빨강으로 두지 않았다. 우리 빨강은 **에러 전용**이라(DESIGN §5) 달력에
             상시로 켜 두면 그 뜻이 닳는다 — 채움/테두리로만 가른다.
        */}
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-full text-[12px] leading-4 tabular-nums",
            isSelected && "bg-foreground text-background font-semibold",
            !isSelected && isToday && "border-foreground/45 text-foreground border font-semibold",
            !isSelected &&
              !isToday &&
              (isOutside ? "text-muted-foreground/45" : "text-muted-foreground"),
          )}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* 일정 — 넘치면 여기서만 스크롤한다 */}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pb-1.5">
        {events.map((event) => (
          <EventChip key={event.id} event={event} />
        ))}
      </div>
    </button>
  );
}

/**
 * 일정 한 줄 — **옅은 칩 + 앞에 상태 콩**.
 *
 * ⚠️ **색 축이 둘이고, 색벌도 둘이다.** 바탕(파스텔)은 **무엇인지**(Todo·액션),
 *    앞의 콩은 **어디까지 됐는지**(진행중·완료)다.
 * ⚠️ 예전엔 상태까지 태그 색으로 그렸다 — sky 칩에 sky 콩이 되어 **콩이 제 바탕에 묻혔고**,
 *    "Todo"와 "진행중"이 같은 파랑이라 색이 무엇을 가리키는지 알 수 없었다. 두 축은 **색벌을
 *    갈라야** 비로소 두 축이 된다(`tag-colors.ts`의 teal·slate).
 * ⚠️ 채움/테두리로 상태를 말하던 방식은 걷어냈다 — 콩이 같은 말을 더 분명히 한다.
 * ⚠️ 취소선은 남긴다. 끝난 일은 훑을 때 건너뛸 수 있어야 한다.
 * ⚠️ 제목이 길면 자른다. `min-w-0`이 없으면 flex 자식이 안 줄어들어 칸을 밀어낸다.
 */
function EventChip({ event }: { event: PersonalCalendarEvent }) {
  const done = event.isCompleted;

  return (
    <span
      title={event.title}
      style={{
        color: CALENDAR_TAG_FG[event.tag],
        backgroundColor: event.color ?? CALENDAR_TAG_BG[event.tag],
      }}
      className={cn(
        /*
          ⚠️ `shrink-0`이 **핵심**이다. 칩은 세로 flex의 자식이라 기본값(`flex-shrink:1`)이면
             칸이 모자랄 때 넘치는 대신 **하나씩 납작하게 눌린다** — 15개를 넣어도
             `scrollHeight`가 안 늘어나 스크롤이 아예 안 생겼다. 안 줄어들어야 넘치고,
             넘쳐야 그 칸만 스크롤한다(이게 라이브러리를 걷어낸 이유다).
        */
        "relative flex shrink-0 items-center gap-1 rounded px-1.5 text-[11px] leading-[16px] font-medium",
        /*
          ⚠️ 취소선을 **칩 전체**에 긋는다. `line-through`는 글자 위에만 그어져서, 제목이
             짧거나 잘리면 선이 중간에 끊겨 지저분했다 — 가운데를 가로지르는 선 하나로 둔다.
        */
        done &&
          "after:absolute after:inset-x-1.5 after:top-1/2 after:h-px after:-translate-y-1/2 after:bg-current after:opacity-70",
      )}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: calendarStatusDotColor(done) }}
      />
      <span className="min-w-0 truncate">{event.title}</span>
    </span>
  );
}
