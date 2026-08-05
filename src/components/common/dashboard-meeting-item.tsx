import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { MEETING_STATUS, MEETING_STATUS_LABEL, type MeetingStatus } from "@/constants/domain";
import { cn } from "@/lib/utils";

/**
 * 대시보드 "회의" 위젯 한 줄의 UI 계약 — 오너·팀장 대시보드가 **공용**으로 쓴다.
 * 라벨은 2단이다:
 *   - `originLabel`(항상): 회의의 소속·권한 — 오너 개설="Owner", 팀 회의=부서명("개발팀").
 *   - `hostLabel`(선택): **개설자(주최자) 사람** — 비오너 회의만. 오너 회의는 개설 주체를
 *     "Owner"로 추상화하므로 없다. 이 규칙은 나중의 회의 목록·탭에도 그대로 적용된다.
 */
export interface DashboardMeeting {
  id: string;
  title: string;
  projectTag: string;
  /** 자유 HEX(프로젝트 태그 색) */
  color: string;
  status: MeetingStatus;
  /** 회의실 장소 이름(예: "회의실 A") */
  room: string;
  scheduledAt: string;
  attendeeCount: number;
  /** 소속·권한 라벨 — 오너 개설="Owner", 팀 회의=부서명("개발팀") */
  originLabel: string;
  /** 개설자 사람 — 팀장이면 "김서준(팀장)", 팀원이면 "이하윤". 오너 회의는 없음(undefined) */
  hostLabel?: string;
}

/**
 * 회의 한 줄 높이(px). 대시보드 박스 높이가 이 값 × 최대 수에서 나오므로 한 곳에 둔다.
 * 박스에 정확히 N건이 채워져 스크롤이 안 생기게 하는 기준이다.
 */
export const MEETING_ITEM_HEIGHT = 72;

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

/** 카피 규칙: 날짜 `8월 5일(화) 10:00` 포맷(CLAUDE.md §디자인 토큰). 테스트를 위해 export. */
export function formatMeetingDate(dateIso: string): string {
  const date = new Date(dateIso);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${WEEKDAY_LABEL[date.getDay()]}) ${hour}:${minute}`;
}

/**
 * 회의 상태 색 — 상태 흐름(예정→진행중→완료)이 한눈에 보이게 색으로 구분한다(토큰이라 다크 자동).
 * 예정=파랑(primary) · 진행중=초록(success) · 완료=회색(muted).
 */
const STATUS_TONE: Record<MeetingStatus, string> = {
  [MEETING_STATUS.SCHEDULED]: "bg-primary/10 text-primary",
  [MEETING_STATUS.IN_PROGRESS]: "bg-success/12 text-success",
  [MEETING_STATUS.DONE]: "bg-muted text-muted-foreground",
};

interface DashboardMeetingItemProps {
  meeting: DashboardMeeting;
  /** 목록의 첫 항목이 아니면 위쪽 구분선을 그린다 */
  showDivider: boolean;
}

/** 좌: 태그·회의명·개설 라벨 / 우: 회의실·시간·참석 + 상태 라벨(맨 오른쪽). */
export function DashboardMeetingItem({ meeting, showDivider }: DashboardMeetingItemProps) {
  return (
    <li
      className={cn(showDivider && "border-border border-t")}
      style={{ height: MEETING_ITEM_HEIGHT }}
    >
      <Link
        href={`/app/meeting/${meeting.id}`}
        className="hover:bg-muted flex h-full items-center transition-colors"
      >
        {/* 프로젝트 색 왼쪽 막대 — 행 위아래 끝에 딱 붙는 얇은 세로선 */}
        <span
          className="h-full w-1 shrink-0"
          style={{ backgroundColor: meeting.color }}
          aria-hidden
        />

        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
          {/* 좌: (상단) 프로젝트 태그 / (하단) 회의명 + 개설 라벨 */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <span
              className="w-fit rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
              style={{ backgroundColor: `${meeting.color}1a`, color: meeting.color }}
            >
              {meeting.projectTag}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[15px]">{meeting.title}</span>
              {/* 소속·권한 라벨(항상) + 개설자 라벨(비오너 회의만) */}
              <Badge variant="secondary" className="shrink-0">
                {meeting.originLabel}
              </Badge>
              {meeting.hostLabel && (
                <Badge variant="outline" className="shrink-0">
                  {meeting.hostLabel}
                </Badge>
              )}
            </div>
          </div>

          {/* 우: 회의실 · 시간 · 참석 인원 + 상태 라벨(맨 오른쪽 끝) */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span>{meeting.room}</span>
              <span aria-hidden>·</span>
              <span className="font-mono">{formatMeetingDate(meeting.scheduledAt)}</span>
              <span aria-hidden>·</span>
              <span>참석 {meeting.attendeeCount}명</span>
            </div>
            <span
              className={cn(
                "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium",
                STATUS_TONE[meeting.status],
              )}
            >
              {MEETING_STATUS_LABEL[meeting.status]}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
