import Link from "next/link";

import type { StatusTone } from "@/components/common/status-dot";
import { ACTION_DELAYED_LABEL, ACTION_STATUS, ACTION_STATUS_LABEL } from "@/constants/domain";
import {
  buildActionTimeline,
  type TimelineActionInput,
  type TimelineDay,
} from "@/features/member/action-timeline";
import { cn } from "@/lib/utils";

/**
 * 처리할 액션 타임라인 — GitHub Projects Roadmap 결. 좌측 아이템 열 + 우측 날짜 축.
 * 각 액션을 **시작일→마감일 기간 바**로 그리고, 오늘 세로선이 가로지른다.
 * ⚠️ 상태는 색만으로 전하지 않는다 — 바의 `aria-label`에 상태·기간을 함께 넣는다(§a11y).
 */

const TONE_LABEL: Record<StatusTone, string> = {
  DELAYED: ACTION_DELAYED_LABEL,
  IN_PROGRESS: ACTION_STATUS_LABEL[ACTION_STATUS.IN_PROGRESS],
  TODO: ACTION_STATUS_LABEL[ACTION_STATUS.TODO],
  DONE: ACTION_STATUS_LABEL[ACTION_STATUS.DONE],
};

/** 상태점(좌측 열) — `StatusDot`과 같은 색 셋. */
const DOT_CLASS: Record<StatusTone, string> = {
  DELAYED: "bg-destructive",
  IN_PROGRESS: "bg-status-progress",
  TODO: "bg-status-todo",
  DONE: "bg-status-done",
};

/** 기간 바 배경·테두리·글자. */
const BAR_CLASS: Record<StatusTone, string> = {
  DELAYED: "border-destructive/30 bg-destructive/10 text-destructive",
  IN_PROGRESS: "border-success/40 bg-success/12 text-success",
  TODO: "border-border bg-muted text-muted-foreground",
  DONE: "border-border bg-muted text-muted-foreground",
};

/** 마감 지점 캡 — 세 상태 모두 같은 무게로 진하게(할일도 옅은 회색 아님). */
const CAP_CLASS: Record<StatusTone, string> = {
  DELAYED: "bg-destructive",
  IN_PROGRESS: "bg-status-progress",
  TODO: "bg-muted-foreground",
  DONE: "bg-muted-foreground",
};

/** 축 날짜 색 — 오늘은 파랑 대신 먹색 볼드(토요일 파랑과 안 겹치게) · 토=파랑 · 일=빨강. */
function dayToneClass(day: TimelineDay): string {
  if (day.isToday) return "text-foreground font-bold";
  if (day.isSaturday) return "text-primary";
  if (day.isSunday) return "text-destructive";
  return "text-muted-foreground";
}

/** 왼쪽 아이템 열 폭 — 축 머리·그리드·행이 같은 값을 공유한다. */
const LABEL_COL = "w-[200px]";

interface ActionTimelineProps {
  items: TimelineActionInput[];
  /** 오늘(서버 렌더 시각). 축 기준점. */
  today: Date;
  /** 비었을 때 문구 */
  emptyLabel?: string;
}

export function ActionTimeline({
  items,
  today,
  emptyLabel = "표시할 액션이 없습니다.",
}: ActionTimelineProps) {
  const model = buildActionTimeline(items, today);

  if (!model) {
    return (
      <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        {emptyLabel}
      </p>
    );
  }

  const { days, bars, todayLeftPct, monthLabel } = model;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 날짜 축 */}
      <div className="border-border flex shrink-0 border-b text-[10.5px]">
        <div className={cn("text-muted-foreground shrink-0 self-end px-3 pt-2 pb-1.5", LABEL_COL)}>
          {monthLabel}
        </div>
        <div className="flex flex-1">
          {days.map((day) => (
            <div
              key={day.iso}
              className={cn("flex-1 py-1.5 text-center leading-tight", dayToneClass(day))}
            >
              <span className="block">{day.isToday ? "오늘" : day.weekday}</span>
              <span className="block font-semibold tabular-nums">{day.dayOfMonth}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 본문 — 배경 그리드·오늘선(뒤) + 행들(앞, 내부 스크롤) */}
      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-0 flex" aria-hidden>
          <div className={cn("shrink-0", LABEL_COL)} />
          <div className="relative flex flex-1">
            {days.map((day) => (
              <div key={day.iso} className="border-border/55 flex-1 border-l first:border-l-0" />
            ))}
            <span
              className="bg-primary absolute inset-y-0 w-0.5 -translate-x-1/2"
              style={{ left: `${todayLeftPct}%` }}
            />
          </div>
        </div>

        <ul className="scrollbar-hidden absolute inset-0 overflow-y-auto">
          {bars.map((bar) => (
            <li
              key={bar.id}
              className="border-border flex h-11 items-stretch border-t first:border-t-0"
            >
              {/* 좌: 상태점 · 액션명 · 프로젝트 태그 */}
              <div className={cn("flex shrink-0 items-center gap-2 px-3", LABEL_COL)}>
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[bar.tone])}
                  aria-hidden
                />
                <span className="truncate text-[13px]">{bar.title}</span>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                  style={{ backgroundColor: `${bar.tagColor}1a`, color: bar.tagColor }}
                >
                  {bar.tag}
                </span>
              </div>

              {/* 우: 기간 바 */}
              <div className="relative flex-1">
                <Link
                  href={bar.href}
                  aria-label={`${bar.title}, ${bar.tag}, ${TONE_LABEL[bar.tone]}, ${bar.ddayLabel}, ${bar.periodLabel}`}
                  className={cn(
                    "absolute top-1/2 flex h-[22px] min-w-[42px] -translate-y-1/2 items-center justify-end rounded border pr-2 text-[11px] font-semibold tabular-nums transition-shadow hover:shadow-sm",
                    BAR_CLASS[bar.tone],
                  )}
                  style={{ left: `${bar.leftPct}%`, width: `${bar.widthPct}%` }}
                >
                  {bar.ddayLabel}
                  <span
                    className={cn(
                      "absolute inset-y-0 right-0 w-[3px] rounded-r",
                      CAP_CLASS[bar.tone],
                    )}
                    aria-hidden
                  />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** 축과 짝이 되는 범례 — 카드 헤더 우측에 둔다(색=상태 의미를 한 줄로). */
export function ActionTimelineLegend() {
  const legend: { tone: StatusTone; label: string }[] = [
    { tone: "DELAYED", label: TONE_LABEL.DELAYED },
    { tone: "IN_PROGRESS", label: TONE_LABEL.IN_PROGRESS },
    { tone: "TODO", label: TONE_LABEL.TODO },
  ];

  return (
    <div className="text-muted-foreground flex items-center gap-3 text-xs">
      {legend.map(({ tone, label }) => (
        <span key={tone} className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", DOT_CLASS[tone])} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
