import { CalendarClock, DoorOpen, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { MEETING_STATUS, MEETING_STATUS_LABEL, type MeetingStatus } from "@/constants/meeting";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { MeetingListItem } from "../view-types";

/**
 * 회의 카드 한 장.
 *
 * ⚠️ **완료 카드만 눌린다**(WORKFLOW §3-2). 예정·진행중은 참석자에게 입장 개념이 없어
 *    카드가 반응하지 않는다 — 눌리는 척(`hover`)도 하지 않는다(§정직성).
 * ⚠️ [입장]은 **Host에게만**, 예정·진행중에만 뜬다. 캡처 화면(#217)이 아직 없어서
 *    버튼은 잠그고 이유를 말한다 — 404로 보내는 것보다 낫다(§링크는 실제 화면으로만).
 */

/** 상태 뱃지 — 대시보드 회의 위젯과 같은 톤을 쓴다(같은 값이 화면마다 다르면 안 된다) */
const STATUS_BADGE_CLASS: Record<MeetingStatus, string> = {
  [MEETING_STATUS.SCHEDULED]: "bg-primary/10 text-primary",
  [MEETING_STATUS.IN_PROGRESS]: "bg-success/12 text-success",
  [MEETING_STATUS.DONE]: "bg-muted text-muted-foreground",
};

function CardBody({ meeting }: { meeting: MeetingListItem }) {
  const color = pickPaletteColor(meeting.projectTag);

  return (
    <>
      {/* 왼쪽 세로 띠 — 어느 프로젝트인지(§DESIGN 5: 색을 써도 되는 자리) */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color.solidColor }}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[15px] leading-6 font-semibold">{meeting.title}</p>
        <span
          className={cn(
            "shrink-0 rounded px-2 py-0.5 text-[11px] leading-4 font-medium",
            STATUS_BADGE_CLASS[meeting.status],
          )}
        >
          {MEETING_STATUS_LABEL[meeting.status]}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className="rounded px-1.5 py-px text-[11px] leading-4 font-medium"
          style={{ backgroundColor: color.bgColor, color: color.textColor }}
        >
          {meeting.projectTag}
        </span>
        <span className="border-border text-muted-foreground rounded border px-1.5 py-px text-[11px] leading-4">
          {meeting.originLabel}
        </span>
      </div>

      <p className="text-muted-foreground truncate text-[13px] leading-5">{meeting.topicSummary}</p>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[12px] leading-4">
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5" aria-hidden />
          <span className="translate-y-[1px] tabular-nums">{meeting.schedule}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden />
          <span className="translate-y-[1px]">{meeting.roomName}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden />
          <span className="translate-y-[1px] tabular-nums">{meeting.attendeeCount}명</span>
        </span>
      </div>
    </>
  );
}

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  const frameClass =
    "border-border bg-card relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-5";

  if (meeting.status === MEETING_STATUS.DONE) {
    return (
      <Link
        href={`/app/meeting/${meeting.id}`}
        className={cn(frameClass, "hover:bg-foreground/[0.02] transition-colors")}
      >
        <CardBody meeting={meeting} />
      </Link>
    );
  }

  return (
    <div className={frameClass}>
      <CardBody meeting={meeting} />

      {meeting.isHost && (
        /*
          ⚠️ 시간 제약 없이 노출한다(§3-2). 캡처 화면이 생기면(#217) 이 버튼이
             `/app/meeting/:id/capture` 링크로 바뀐다 — 그 전까지는 잠그고 이유를 적는다.
        */
        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled
            title="캡처 화면 준비 중입니다"
            className="border-border text-muted-foreground flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border px-3 text-[13px] leading-5 opacity-60"
          >
            <DoorOpen className="size-3.5" aria-hidden />
            <span className="translate-y-[1px]">입장</span>
          </button>
        </div>
      )}
    </div>
  );
}
