import type { StatusTone } from "@/components/common/status-dot";

/**
 * 처리할 액션 타임라인의 순수 계산 계층 — React 무관이라 그대로 테스트한다.
 * 나중에 프로젝트/팀 액션 상세의 로드맵으로 추출할 때 이 파일이 재사용 씨앗이다.
 */

/** 타임라인 한 줄의 입력 계약 — 멤버 액션 등 특정 도메인 타입에 묶이지 않는 범용 입력이다. */
export interface TimelineActionInput {
  id: string;
  title: string;
  /** 프로젝트 태그 */
  tag: string;
  /** 태그 칩 배경·글자색 — 고정 팔레트(`lib/palette` → `pickPaletteColor`)에서 뽑은 값. 자유 HEX 아님. */
  tagBgColor: string;
  tagTextColor: string;
  /** 작업 시작일 `YYYY-MM-DD` — 바의 왼쪽 끝 */
  startDate: string;
  /** 마감일 `YYYY-MM-DD` — 바의 오른쪽 끝(마감 지점) */
  dueDate: string;
  /** 상태 색(지연=파생값 포함). `StatusDot`과 같은 셋을 쓴다. */
  tone: StatusTone;
  /** 클릭 시 이동할 상세 경로 */
  href: string;
}

/** 축의 하루 칸. */
export interface TimelineDay {
  iso: string;
  dayOfMonth: number;
  /** 일~토 */
  weekday: string;
  isToday: boolean;
  isSaturday: boolean;
  isSunday: boolean;
}

/** 한 액션의 기간 바 — day-area 대비 백분율로 놓는다. */
export interface TimelineBar extends TimelineActionInput {
  leftPct: number;
  widthPct: number;
  /** `D-day`·`D-n`·`D+n` */
  ddayLabel: string;
  /** 스크린리더용 기간 텍스트(예: `8월 1일~8월 3일`) */
  periodLabel: string;
}

export interface ActionTimelineModel {
  days: TimelineDay[];
  bars: TimelineBar[];
  /** 오늘선 위치(%) — 오늘을 축 범위에 항상 포함하므로 값이 있다. */
  todayLeftPct: number;
  /** 축 머리 라벨(예: `8월`) */
  monthLabel: string;
}

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"] as const;
const MS_PER_DAY = 86_400_000;

/** 날짜 전용 값을 로컬 자정으로 파싱 — `lib.getDaysUntilDue`와 같은 규칙(UTC 자정 밀림 방지). */
function parseLocalDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 오늘(로컬 자정) 대비 D-day 라벨 — 전달받은 `today`로 계산해 순수하게 유지한다. */
function formatDdayFrom(due: Date, todayMid: Date): string {
  const days = diffDays(todayMid, due);
  if (days === 0) return "D-day";
  return days > 0 ? `D-${days}` : `D+${-days}`;
}

function formatPeriod(start: Date, due: Date): string {
  const s = `${start.getMonth() + 1}월 ${start.getDate()}일`;
  const e = `${due.getMonth() + 1}월 ${due.getDate()}일`;
  return s === e ? s : `${s}~${e}`;
}

/** 축 머리 라벨 — 범위가 달을 넘으면 `7~8월`, 아니면 `8월`. */
function formatMonthLabel(rangeStart: Date, rangeEnd: Date): string {
  const startMonth = rangeStart.getMonth() + 1;
  const endMonth = rangeEnd.getMonth() + 1;
  return startMonth === endMonth ? `${startMonth}월` : `${startMonth}~${endMonth}월`;
}

/**
 * 액션들을 오늘 기준 기간 타임라인 모델로 만든다. 비면 `null`.
 * 축 범위 = `min(시작일, 오늘) ~ max(마감일, 오늘)` — 오늘선이 항상 보이도록 오늘을 포함한다.
 * 위치는 day-area 백분율이라 축·오늘선·바가 같은 좌표계를 공유한다.
 */
export function buildActionTimeline(
  items: TimelineActionInput[],
  today: Date,
): ActionTimelineModel | null {
  if (items.length === 0) return null;

  const todayMid = startOfDay(today);
  const startTimes = items.map((it) => parseLocalDate(it.startDate).getTime());
  const dueTimes = items.map((it) => parseLocalDate(it.dueDate).getTime());

  const rangeStart = new Date(Math.min(todayMid.getTime(), ...startTimes));
  const rangeEnd = new Date(Math.max(todayMid.getTime(), ...dueTimes));
  const totalDays = diffDays(rangeStart, rangeEnd) + 1;
  const dayPct = 100 / totalDays;

  const days: TimelineDay[] = Array.from({ length: totalDays }, (_, i) => {
    const date = addDays(rangeStart, i);
    const weekdayIndex = date.getDay();
    return {
      iso: toLocalIso(date),
      dayOfMonth: date.getDate(),
      weekday: WEEKDAY_LABEL[weekdayIndex] ?? "",
      isToday: diffDays(date, todayMid) === 0,
      isSaturday: weekdayIndex === 6,
      isSunday: weekdayIndex === 0,
    };
  });

  const bars: TimelineBar[] = items.map((it) => {
    const start = parseLocalDate(it.startDate);
    const due = parseLocalDate(it.dueDate);
    const startIndex = diffDays(rangeStart, start);
    const endIndex = diffDays(rangeStart, due);
    return {
      ...it,
      leftPct: startIndex * dayPct,
      widthPct: (endIndex - startIndex + 1) * dayPct,
      ddayLabel: formatDdayFrom(due, todayMid),
      periodLabel: formatPeriod(start, due),
    };
  });

  return {
    days,
    bars,
    // 오늘 칸의 왼쪽 끝이 아니라 **칸 중앙**(+0.5)에 선을 놓는다.
    todayLeftPct: (diffDays(rangeStart, todayMid) + 0.5) * dayPct,
    monthLabel: formatMonthLabel(rangeStart, rangeEnd),
  };
}
