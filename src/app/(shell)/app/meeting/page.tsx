import type { Metadata } from "next";

import {
  MEETING_TAB,
  MeetingListView,
  type MeetingTab,
} from "@/features/meeting/components/meeting-list-view";
import { getMeetingDirectory } from "@/features/meeting/server";
import { getViewer } from "@/features/shell/viewer";

/*
  ⚠️ 정적으로 굳히지 않는다 — 예약이 회의를 만들고 상태가 시각으로 변하는 화면이라
     빌드 시각 값이 박히면 방금 잡은 회의가 안 보인다(사원 관리와 같은 이유).
*/
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "회의",
};

/** 주소에서 온 탭 값 — 모르는 값이면 첫 탭으로 되돌린다 */
function parseTab(value: string | string[] | undefined): MeetingTab {
  return value === MEETING_TAB.INVITED ? MEETING_TAB.INVITED : MEETING_TAB.HOSTED;
}

/**
 * 회의 목록(WORKFLOW §3-2) — 조회뿐이라 Server Component 하나로 끝난다.
 *
 * ⚠️ **목록은 전 구성원 공개**다(§3-2-1) — 권한 가드가 없다. 막는 건 상세다.
 * ⚠️ "새 회의 만들기" 버튼이 없다 — 생성 진입점은 `/app/rooms` 예약 모달 하나뿐이다(§3-1).
 */
export default async function AppMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const tab = parseTab((await searchParams).tab);
  const viewer = await getViewer();
  const directory = await getMeetingDirectory(viewer.id);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1440px]">
        <MeetingListView directory={directory} tab={tab} />
      </div>
    </main>
  );
}
