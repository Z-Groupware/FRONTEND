import Link from "next/link";

import { cn } from "@/lib/utils";

import type { MeetingDirectory, MeetingListItem } from "../view-types";
import { MeetingCard } from "./meeting-card";

/**
 * 회의 목록 — 탭 두 개가 전부다(WORKFLOW §3-2).
 *
 * ⚠️ **"새 회의 만들기" 버튼이 없다.** 회의 생성 진입점은 `/app/rooms` 예약 모달 하나뿐이다
 *    (§3-1) — 여기 버튼을 두면 진입점이 두 개가 된다.
 * ⚠️ 탭은 **주소로** 오간다(`?tab=`). 화면 상태로 두면 새로고침·뒤로 가기에서 탭이 날아간다.
 *    서버 컴포넌트라 클릭은 `Link`다 — 프로젝트 목록의 `?status=`와 같은 패턴.
 */

export const MEETING_TAB = {
  HOSTED: "hosted",
  INVITED: "invited",
} as const;
export type MeetingTab = (typeof MEETING_TAB)[keyof typeof MEETING_TAB];

const TAB_LABEL: Record<MeetingTab, string> = {
  hosted: "내가 개설한",
  invited: "참여해야 할",
};

function TabLink({ tab, isActive, count }: { tab: MeetingTab; isActive: boolean; count: number }) {
  return (
    <Link
      href={tab === MEETING_TAB.HOSTED ? "/app/meeting" : `/app/meeting?tab=${tab}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] leading-5 transition-colors",
        isActive
          ? "bg-foreground text-background font-medium"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {TAB_LABEL[tab]}
      <span
        className={cn(
          "rounded px-1 text-[11px] leading-4 tabular-nums",
          isActive ? "bg-background/20" : "bg-secondary",
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function EmptyState({ tab }: { tab: MeetingTab }) {
  return (
    /*
      ⚠️ 없다는 말만 두지 않는다 — 다음에 무엇을 하면 생기는지를 같이 적는다(§상태 세 장).
         두 탭은 비는 이유가 달라 문구도 다르다.
    */
    <div className="border-border bg-card rounded-2xl border px-7 py-12 text-center">
      {tab === MEETING_TAB.HOSTED ? (
        <>
          <p className="text-[13px] leading-5">아직 개설한 회의가 없습니다.</p>
          <p className="text-muted-foreground pt-1 text-[12px] leading-4">
            회의는 회의실 예약과 함께 만들어집니다 — 회의실 화면에서 시간대를 예약해 주세요.
          </p>
        </>
      ) : (
        <>
          <p className="text-[13px] leading-5">참여할 회의가 없습니다.</p>
          <p className="text-muted-foreground pt-1 text-[12px] leading-4">
            참석자로 지정되면 이 자리에 나타납니다.
          </p>
        </>
      )}
    </div>
  );
}

export function MeetingListView({
  directory,
  tab,
}: {
  directory: MeetingDirectory;
  tab: MeetingTab;
}) {
  const items: MeetingListItem[] =
    tab === MEETING_TAB.HOSTED ? directory.hosted : directory.invited;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="border-border bg-secondary/60 flex w-fit items-center gap-0.5 rounded-lg border p-0.5"
        role="group"
        aria-label="회의 거르기"
      >
        <TabLink
          tab={MEETING_TAB.HOSTED}
          isActive={tab === MEETING_TAB.HOSTED}
          count={directory.hosted.length}
        />
        <TabLink
          tab={MEETING_TAB.INVITED}
          isActive={tab === MEETING_TAB.INVITED}
          count={directory.invited.length}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        /*
          ⚠️ 칸 수를 박지 않는다(`auto-fill`) — 사이드바가 있는 폭·배율마다 칸이 찌그러진다
             (구성원 조직도와 같은 이유).
        */
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {items.map((meeting) => (
            <li key={meeting.id}>
              <MeetingCard meeting={meeting} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
