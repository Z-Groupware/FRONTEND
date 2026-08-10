import { CalendarClock, DoorOpen, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { ProjectTag } from "@/components/common/project-tag";
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
  return (
    <>
      {/* 위쪽 띠 — 어느 프로젝트인지(DESIGN §5). 세로 띠는 둥근 모서리에서 잘려 보였다 */}
      <ProjectAccent tag={meeting.projectTag} />

      {/*
        ⚠️ **머리를 두 줄로 줄인다**(2026-08-10). 제목 / 칩 / 안건이 세 층으로 쌓여 있어
           한 카드가 네 덩이로 읽혔다 — 층이 많을수록 눈이 어디를 먼저 볼지 못 정한다.
           칩과 안건은 둘 다 "무슨 회의인지"를 말하므로 한 줄로 묶는다.
      */}
      {/*
        ⚠️ **태그를 제목 옆에 붙인다.** 아랫줄에 두면 그 줄에 칩·배지·평문 셋이 섞여
           높이도 모양도 제각각이라 지저분했다 — 다른 화면(액션 상세·검색)도 태그는 제목 옆이다.
      */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 flex-1 items-center gap-2">
          <ProjectTag tag={meeting.projectTag} />
          <span className="truncate text-[17px] leading-7 font-semibold tracking-[-0.3px]">
            {meeting.title}
          </span>
        </p>
        <span
          className={cn(
            /*
              ⚠️ **12px·h-6으로 키운다.** 11px 배지는 카드 구석의 꼬리표처럼 읽혀 상태가
                 눈에 안 걸렸다 — 이 카드에서 제목 다음으로 먼저 봐야 하는 값이다.
            */
            "inline-flex h-6 shrink-0 items-center rounded-md border px-2.5 text-[12px] leading-4",
            MEETING_STATUS_BADGE_CLASS[meeting.status],
          )}
        >
          {MEETING_STATUS_LABEL[meeting.status]}
        </span>
      </div>

      {/*
        ⚠️ **둘째 줄은 평문 한 줄이다.** 출처(`Owner 개설`)를 배지로 두니 옆 칩과 높이·모서리가
           달라 한 줄에 두 종류의 상자가 섞였다 — 둘 다 "이 회의가 어디서 왔나"를 말하는
           **곁 정보**라 같은 무게의 글로 이어 붙인다.
        ⚠️ 가운뎃점으로 잇는다. 상자를 없앤 자리에 구분자가 필요하다.
      */}
      <p className="text-muted-foreground truncate pt-2 text-[13px] leading-5">
        {meeting.originLabel}
        <span className="px-1.5 opacity-50">·</span>
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
    <div className="border-border mt-auto flex items-center justify-between gap-3 border-t pt-3.5">
      <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-4">
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          {/* 아이콘 옆 한글은 1px 내린다(DESIGN §5) */}
          <span className="tabular-nums">{meeting.schedule}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span>{meeting.roomName}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5 shrink-0" aria-hidden />
          <span className="tabular-nums">{meeting.attendeeCount}명</span>
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
            <span>입장</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  /* ⚠️ `h-full`이라 한 줄의 카드가 가장 큰 것에 맞춰 같은 높이로 선다 */
  const frameClass =
    "border-border bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-7";

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
