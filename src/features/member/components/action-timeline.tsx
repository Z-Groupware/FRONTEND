import Link from "next/link";

import type { StatusTone } from "@/components/common/status-dot";
import { ACTION_DELAYED_LABEL, ACTION_STATUS, ACTION_STATUS_LABEL } from "@/constants/domain";
import {
  buildActionTimeline,
  TIMELINE_DAY_WIDTH_PX,
  type TimelineActionInput,
  type TimelineBar,
  type TimelineDay,
} from "@/features/member/action-timeline";
import { cn } from "@/lib/utils";

/**
 * 처리할 액션 타임라인 — GitHub Projects Roadmap 결. 좌측 아이템 열 + 우측 날짜 축.
 * 각 액션을 **시작일→마감일 기간 바**로 그리고, 오늘 세로선이 가로지른다.
 * ⚠️ 날짜 칸은 고정폭(`TIMELINE_DAY_WIDTH_PX`)이다 — 기간이 길어지면 칸을 눌러 욱여넣지 않고
 *    **가로 스크롤**로 보여준다(2026-08-06 정정).
 * ⚠️ **스크롤 컨테이너는 하나뿐이다**(가로·세로 전부). 헤더는 `sticky top-0`, 좌측 아이템 열은
 *    `sticky left-0`로 고정한다 — 세로 스크롤용 안쪽 컨테이너를 따로 두면(`overflow-y-auto`),
 *    그 안의 `sticky left-0`가 바깥 가로 스크롤이 아니라 그 안쪽 컨테이너 기준으로 붙어버려서
 *    가로로 스크롤할 때 라벨 열이 통째로 사라진다(2026-08-06에 실제로 겪은 버그 — sticky의
 *    포함 블록은 "가장 가까운 스크롤 컨테이너"라 컨테이너를 하나로 합쳐야 한다).
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

/** 기간 바(또는 href 없을 때의 비클릭 바) 공통 클래스. */
function barClassName(tone: StatusTone): string {
  return cn(
    "absolute top-1/2 flex h-[22px] min-w-[42px] -translate-y-1/2 items-center justify-end rounded border pr-2 text-[11px] font-semibold tabular-nums",
    BAR_CLASS[tone],
  );
}

function barAriaLabel(bar: TimelineBar): string {
  return `${bar.title}, ${bar.tag}, ${TONE_LABEL[bar.tone]}, ${bar.ddayLabel}, ${bar.periodLabel}`;
}

/** 마감 지점 캡 — Link·div 양쪽에서 같이 쓴다. */
function BarCap({ tone }: { tone: StatusTone }) {
  return (
    <span
      className={cn("absolute inset-y-0 right-0 w-[3px] rounded-r", CAP_CLASS[tone])}
      aria-hidden
    />
  );
}

/** 축 날짜 색 — 오늘은 파랑 대신 먹색 볼드(토요일 파랑과 안 겹치게) · 토=파랑 · 일=빨강. */
function dayToneClass(day: TimelineDay): string {
  if (day.isToday) return "text-foreground font-bold";
  if (day.isSaturday) return "text-primary";
  if (day.isSunday) return "text-destructive";
  return "text-muted-foreground";
}

/** 왼쪽 아이템 열 폭 — 축 머리·그리드·행이 같은 값을 공유한다. 스크롤 중에도 고정(sticky). */
const LABEL_COL_PX = 200;
const LABEL_COL_STYLE = { width: LABEL_COL_PX, minWidth: LABEL_COL_PX };
/** 행 높이(px) — 그리드 오버레이 높이 계산에 쓴다(행 수 × 이 값). */
const ROW_HEIGHT_PX = 44;

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

  const { days, bars, todayLeftPx, totalWidthPx, monthLabel } = model;
  const gridHeightPx = bars.length * ROW_HEIGHT_PX;

  return (
    <div className="scrollbar-hidden min-h-0 flex-1 overflow-auto">
      <div className="relative" style={{ minWidth: LABEL_COL_PX + totalWidthPx }}>
        {/* 날짜 축 — 세로 스크롤 중에도 위에 고정. z는 아래 그리드(0)·행(20)보다 항상 높게(30) */}
        <div className="border-border bg-card sticky top-0 z-30 flex border-b text-[10.5px]">
          {/*
            ⚠️ `self-stretch` + 내부 `items-end`로 라벨이 헤더 전체 높이를 채운다 — `self-end`(짧은
            박스)만 쓰면 라벨 위쪽 몇 px가 이 칸의 배경으로 안 덮여서, 가로 스크롤로 지나가는 날짜
            칸이 그 틈으로 살짝 비친다(2026-08-06에 실제로 겪은 버그).
          */}
          <div
            className="bg-card sticky left-0 z-10 flex shrink-0 items-end self-stretch px-3 pb-1.5"
            style={LABEL_COL_STYLE}
          >
            <span className="text-muted-foreground">{monthLabel}</span>
          </div>
          <div className="bg-card flex">
            {days.map((day) => (
              <div
                key={day.iso}
                className={cn("shrink-0 py-1.5 text-center leading-tight", dayToneClass(day))}
                style={{ width: TIMELINE_DAY_WIDTH_PX }}
              >
                <span className="block">{day.isToday ? "오늘" : day.weekday}</span>
                <span className="block font-semibold tabular-nums">{day.dayOfMonth}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 행 묶음 — 그리드 오버레이가 이 래퍼 하나에만 딱 맞으면 되니 헤더 높이를 몰라도 된다 */}
        <div className="relative" style={{ height: gridHeightPx }}>
          {/* 배경 그리드·오늘선(뒤) — 항상 행(z-20)보다 아래 */}
          <div className="pointer-events-none absolute inset-0 z-0 flex" aria-hidden>
            <div className="shrink-0" style={LABEL_COL_STYLE} />
            <div className="relative flex" style={{ width: totalWidthPx }}>
              {days.map((day) => (
                <div
                  key={day.iso}
                  className="border-border/55 shrink-0 border-l first:border-l-0"
                  style={{ width: TIMELINE_DAY_WIDTH_PX }}
                />
              ))}
              <span
                className="bg-primary absolute inset-y-0 w-0.5 -translate-x-1/2"
                style={{ left: todayLeftPx }}
              />
            </div>
          </div>

          {/* 행들 — 보통 흐름(세로 스크롤은 바깥 컨테이너가 한다) */}
          {bars.map((bar, index) => {
            // ⚠️ 좌측 아이템(제목·칩)과 우측 막대를 한 행으로 묶어 같이 클릭되게 한다 —
            //    막대만 눌리면 클릭 영역이 좁고, 좌측을 눌렀을 때 반응이 없어 헷갈린다.
            const rowContent = (
              <>
                {/* 좌: 상태점 · 액션명 · 칩(호출부마다 뜻 다름 — 태그 또는 팀명) */}
                <div
                  className="bg-card sticky left-0 z-10 flex min-w-0 shrink-0 items-center gap-2 px-3"
                  style={LABEL_COL_STYLE}
                >
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[bar.tone])}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate text-[13px]">{bar.title}</span>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                    style={{ backgroundColor: bar.tagBgColor, color: bar.tagTextColor }}
                  >
                    {bar.tag}
                  </span>
                </div>

                {/* 우: 기간 바 */}
                <div className="relative" style={{ width: totalWidthPx }}>
                  <div
                    aria-hidden
                    className={barClassName(bar.tone)}
                    style={{ left: bar.leftPx, width: bar.widthPx }}
                  >
                    {bar.ddayLabel}
                    <BarCap tone={bar.tone} />
                  </div>
                </div>
              </>
            );

            const rowClassName = cn(
              "border-border relative flex items-stretch",
              index > 0 && "border-t",
              bar.href && "transition-colors hover:bg-foreground/[0.03]",
            );

            // ⚠️ 상세 라우트가 없으면(`href` 없음) 클릭 안 되는 행으로만 표시
            return bar.href ? (
              <Link
                key={bar.id}
                href={bar.href}
                aria-label={barAriaLabel(bar)}
                className={rowClassName}
                style={{ height: ROW_HEIGHT_PX }}
              >
                {rowContent}
              </Link>
            ) : (
              <div
                key={bar.id}
                aria-label={barAriaLabel(bar)}
                className={rowClassName}
                style={{ height: ROW_HEIGHT_PX }}
              >
                {rowContent}
              </div>
            );
          })}
        </div>
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
