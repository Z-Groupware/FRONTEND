import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { MEETING_STATUS, MEETING_STATUS_LABEL, type MeetingStatus } from "@/constants/domain";
import { formatMeetingDate, MEETING_ITEM_HEIGHT } from "@/features/owner/lib";
import type { OwnerDashboardMeeting } from "@/features/owner/types";
import { cn } from "@/lib/utils";

interface ProjectMeetingItemProps {
  meeting: OwnerDashboardMeeting;
  /** 목록의 첫 항목이 아니면 위쪽 구분선을 그린다 */
  showDivider: boolean;
}

/**
 * 회의 상태 색 — 이 위젯은 상태 흐름(예정→진행중→완료)이 한눈에 보여야 해서 색으로 구분한다.
 * 값은 토큰이라 다크모드가 따라온다: 예정=파랑(primary) · 진행중=초록(success) · 완료=회색(muted).
 */
const STATUS_TONE: Record<MeetingStatus, string> = {
  [MEETING_STATUS.SCHEDULED]: "bg-primary/10 text-primary",
  [MEETING_STATUS.IN_PROGRESS]: "bg-success/12 text-success",
  [MEETING_STATUS.DONE]: "bg-muted text-muted-foreground",
};

/**
 * "최근 프로젝트 회의" 목록의 한 행.
 * ⚠️ 높이는 `MEETING_ITEM_HEIGHT` 고정이다 — 박스 높이가 이 값 × 최대 수로 잡혀 있어,
 *    한 줄이라도 높이가 달라지면 5건이 박스에 안 맞아 스크롤이 생긴다.
 * 좌: 회의명 · 프로젝트 태그 · Owner · 상태 / 우: 회의실 · 시간 · 참석 인원.
 */
export function ProjectMeetingItem({ meeting, showDivider }: ProjectMeetingItemProps) {
  return (
    <li
      className={cn(showDivider && "border-border border-t")}
      style={{ height: MEETING_ITEM_HEIGHT }}
    >
      <Link
        href={`/app/meeting/${meeting.id}`}
        className="hover:bg-muted flex h-full items-center transition-colors"
      >
        {/* 프로젝트 색 왼쪽 막대 — 콩 원 대신 행 위아래 끝에 딱 붙는 얇은 세로선 */}
        <span
          className="h-full w-1 shrink-0"
          style={{ backgroundColor: meeting.color }}
          aria-hidden
        />

        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
          {/* 좌: (상단) 프로젝트 태그 / (하단) 회의명 + Owner */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <span
              className="w-fit rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
              style={{ backgroundColor: `${meeting.color}1a`, color: meeting.color }}
            >
              {meeting.projectTag}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[15px]">{meeting.title}</span>
              <Badge variant="secondary" className="shrink-0">
                Owner
              </Badge>
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
