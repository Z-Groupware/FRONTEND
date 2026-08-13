import { Video } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import type { AttendeeScopeViewer } from "@/features/rooms/attendee-scope";
import type { RoomMember, RoomProjectOption, RoomTeamActionOption } from "@/features/rooms/types";
import { cn } from "@/lib/utils";

import type { MeetingDirectory, MeetingListItem } from "../view-types";
import { MeetingCard } from "./meeting-card";
import { OnlineMeetingDialog } from "./online-meeting-dialog";

/**
 * 회의 목록 — 탭 두 개 + 비대면 회의 진입점(WORKFLOW §3-2, 이슈 #473).
 *
 * ⚠️ **대면 회의는 여기 만드는 버튼이 없다.** 생성 진입점은 `/app/rooms` 예약 모달 하나뿐이다
 *    (§3-1) — 여기 또 두면 진입점이 두 개가 된다. 다만 **비대면 회의는 회의실·시간이 없어
 *    예약이 필요 없다**(이슈 #473)라 이 목록 화면이 그 하나뿐인 진입점이다.
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

/**
 * 회의 탭.
 *
 * ⚠️ **밑줄 탭이다**(2026-08-10 통일). 전에는 검은 알약이었는데, 이 앱의 다른 탭
 *    (검색 결과·팀 액션 상세)은 전부 밑줄이다 — 같은 것이 화면마다 다르면 오갈 때 눈이
 *    "이게 탭인가 버튼인가"를 다시 판단한다.
 * ⚠️ 개수는 **상자에 담지 않는다.** 알약 안에 또 알약을 넣으면 표식이 둘이 된다 —
 *    검색 탭과 같이 숫자만 옆에 둔다.
 */
function TabLink({ tab, isActive, count }: { tab: MeetingTab; isActive: boolean; count: number }) {
  return (
    <Link
      href={tab === MEETING_TAB.HOSTED ? "/app/meeting" : `/app/meeting?tab=${tab}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "focus-visible:ring-ring -mb-px flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2.5 text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-hidden",
        isActive
          ? "border-foreground text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground border-transparent",
      )}
    >
      {TAB_LABEL[tab]}
      <span className="tabular-nums">{count}</span>
    </Link>
  );
}

function MeetingEmptyState({ tab }: { tab: MeetingTab }) {
  const isHosted = tab === MEETING_TAB.HOSTED;

  return (
    /*
      ⚠️ 없다는 말만 두지 않는다 — 다음에 무엇을 하면 생기는지를 같이 적는다(§상태 세 장).
         두 탭은 비는 이유가 달라 문구도 다르다.
    */
    <div className="border-border bg-card rounded-2xl border">
      <EmptyState
        icon={Video}
        title={isHosted ? "아직 개설한 회의가 없습니다." : "참여할 회의가 없습니다."}
        description={
          isHosted
            ? "회의는 회의실 예약과 함께 만들어집니다 — 회의실 화면에서 시간대를 예약해 주세요."
            : "참석자로 지정되면 이 자리에 나타납니다."
        }
      />
    </div>
  );
}

interface MeetingListViewProps {
  directory: MeetingDirectory;
  tab: MeetingTab;
  /** 비대면 회의 다이얼로그로 그대로 흘려보낸다(`/app/rooms/page.tsx`와 같은 데이터 원천). */
  members: RoomMember[];
  projects: RoomProjectOption[];
  showParentTeamAction: boolean;
  teamActions: RoomTeamActionOption[];
  viewer: AttendeeScopeViewer;
}

export function MeetingListView({
  directory,
  tab,
  members,
  projects,
  showParentTeamAction,
  teamActions,
  viewer,
}: MeetingListViewProps) {
  const items: MeetingListItem[] =
    tab === MEETING_TAB.HOSTED ? directory.hosted : directory.invited;

  return (
    <div className="flex flex-col gap-6">
      {/*
        ⚠️ 선(`border-b`)을 **이 바깥 줄**에 건다(2026-08-14, 비대면 회의 버튼을 더하며 옮김).
           탭 두 개만 있을 때는 탭 상자에 걸어도 됐지만, 오른쪽에 버튼을 나란히 두면 탭 상자
           너비만큼만 선이 그어져 버튼 아래는 선이 끊긴다 — 줄 전체 폭으로 선을 그어야
           헤더 한 줄로 읽힌다. `TabLink`의 `-mb-px`는 가장 가까운 `border-b` 조상을 기준으로
           겹치므로 옮겨도 밑줄 탭 모양은 그대로다.
      */}
      <div className="border-border flex items-center justify-between gap-3 border-b">
        <div className="flex gap-1" role="group" aria-label="회의 거르기">
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
        <OnlineMeetingDialog
          members={members}
          projects={projects}
          showParentTeamAction={showParentTeamAction}
          teamActions={teamActions}
          viewer={viewer}
        />
      </div>

      {items.length === 0 ? (
        <MeetingEmptyState tab={tab} />
      ) : (
        /*
          ⚠️ **두 열까지만 넓힌다.** `auto-fill`로 두니 1440에서 넉 줄까지 벌어져 카드 하나가
             340px로 좁아졌다 — 제목이 잘리고 발치 정보가 두 줄로 접혔다. 회의 카드는
             읽을 게 있는 카드라 넓게 두는 편이 낫다(시안도 2열이다).
          ⚠️ `items-stretch`(기본값)를 깨지 않는다. 카드가 `h-full`이라 한 줄이 같은 높이로 선다.
        */
        <ul className="grid grid-cols-1 gap-7 lg:grid-cols-2">
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
