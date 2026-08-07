import { CalendarClock, DoorOpen, MapPin, Users } from "lucide-react";
import Link from "next/link";

import {
  MEETING_STATUS,
  MEETING_STATUS_BADGE_CLASS,
  MEETING_STATUS_LABEL,
} from "@/constants/meeting";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { MeetingListItem } from "../view-types";

/**
 * 회의 카드 한 장.
 *
 * ⚠️ **완료 카드만 눌린다**(WORKFLOW §3-2). 예정·진행중은 참석자에게 입장 개념이 없어
 *    카드가 반응하지 않는다 — 눌리는 척(`hover`)도 하지 않는다(§정직성).
 * ⚠️ [입장]은 **Host에게만**, 예정·진행중에만 뜬다(§3-2, 시간 제약 없음).
 * ⚠️ **카드 높이가 서로 같다.** 머리·본문·발치를 셋으로 나누고 발치를 `mt-auto`로 바닥에
 *    붙인다 — 안 그러면 [입장]이 있는 카드만 길어져 한 줄의 아랫변이 들쭉날쭉해진다.
 * ⚠️ 색은 **프로젝트 띠 하나뿐**이다(DESIGN §5: 색을 써도 되는 자리). 상태는 명도로 가른다.
 */

function ProjectAccent({ tag }: { tag: string }) {
  const color = pickPaletteColor(tag);
  return (
    <span
      className="absolute inset-x-0 top-0 h-1"
      style={{ backgroundColor: color.solidColor }}
      aria-hidden
    />
  );
}

function CardBody({ meeting }: { meeting: MeetingListItem }) {
  const color = pickPaletteColor(meeting.projectTag);

  return (
    <>
      {/* 위쪽 띠 — 어느 프로젝트인지(DESIGN §5). 세로 띠는 둥근 모서리에서 잘려 보였다 */}
      <ProjectAccent tag={meeting.projectTag} />

      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-[15px] leading-6 font-semibold">
          {meeting.title}
        </p>
        <span
          className={cn(
            "shrink-0 rounded border px-2 py-0.5 text-[11px] leading-4",
            MEETING_STATUS_BADGE_CLASS[meeting.status],
          )}
        >
          {MEETING_STATUS_LABEL[meeting.status]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-2">
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

      {/* 안건 요약 — 무슨 회의인지 한 줄(§3-2 안건은 별도 항목이다) */}
      <p className="text-muted-foreground truncate pt-2 text-[13px] leading-5">
        {meeting.topicSummary}
      </p>
    </>
  );
}

/**
 * 발치 — **모든 카드가 같은 줄에서 끝난다.**
 * ⚠️ 왼쪽은 정보, 오른쪽은 조작으로 축을 가른다(DESIGN §3). [입장]이 없는 카드도 같은
 *    높이를 갖도록 줄 자체는 늘 그린다.
 */
function CardFooter({ meeting }: { meeting: MeetingListItem }) {
  return (
    <div className="border-border mt-auto flex items-center justify-between gap-3 border-t pt-3">
      <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-4">
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          {/* 아이콘 옆 한글은 1px 내린다(DESIGN §5) */}
          <span className="translate-y-[1px] tabular-nums">{meeting.schedule}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="translate-y-[1px]">{meeting.roomName}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5 shrink-0" aria-hidden />
          <span className="translate-y-[1px] tabular-nums">{meeting.attendeeCount}명</span>
        </span>
      </div>

      {/*
        ⚠️ 카드 전체를 링크로 감싸지 않는다. 완료 카드만 상세로 가고(§3-2), 예정 카드는
           참석자가 눌러도 반응이 없어야 한다 — 입장은 **Host의 버튼 하나**다.
        ⚠️ 자리는 항상 잡아 둔다. 버튼이 있고 없고에 따라 발치 높이가 달라지면
           한 줄의 카드들이 서로 다른 데서 끝난다.
      */}
      <div className="flex h-8 shrink-0 items-center">
        {meeting.isHost && meeting.status !== MEETING_STATUS.DONE && (
          <Link
            href={`/app/meeting/${meeting.id}/capture`}
            className="border-border hover:border-foreground/40 hover:text-foreground text-muted-foreground focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
          >
            <DoorOpen className="size-3.5" aria-hidden />
            <span className="translate-y-[1px]">입장</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  /* ⚠️ `h-full`이라 한 줄의 카드가 가장 큰 것에 맞춰 같은 높이로 선다 */
  const frameClass =
    "border-border bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 pt-6";

  if (meeting.status === MEETING_STATUS.DONE) {
    return (
      <Link
        href={`/app/meeting/${meeting.id}`}
        className={cn(frameClass, "hover:border-foreground/25 transition-colors")}
      >
        <CardBody meeting={meeting} />
        <CardFooter meeting={meeting} />
      </Link>
    );
  }

  return (
    <div className={frameClass}>
      <CardBody meeting={meeting} />
      <CardFooter meeting={meeting} />
    </div>
  );
}
