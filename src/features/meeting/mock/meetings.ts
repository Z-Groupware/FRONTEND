import { AI_SUMMARY_STATUS, type AiSummaryStatus } from "@/constants/meeting";

import type { Meeting, MeetingDraft } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전. 지금은 `/app/rooms` 예약 액션이 이 스토어를 직접 채운다
 * (`rooms/actions.ts`가 `TOP_LEVEL_PROJECTS`를 직접 참조하는 것과 같은 이유 — 아직
 * `/app/meeting` 쪽 서버·액션 레이어가 없어서 격리막을 통째로 만들 소비자가 없다.
 * `/app/meeting`이 생기면 그때 `meeting/server.ts`가 이 스토어 앞을 막는다).
 * ⚠️ 상태를 `globalThis`에 매단다 — dev의 HMR로 `let`이 초기화되면 방금 만든 회의가 사라진다
 *    (`rooms/mock/reservations.ts`와 같은 트릭).
 */
interface MeetingStore {
  meetings: Meeting[];
  sequence: number;
}

const globalStore = globalThis as typeof globalThis & {
  __meetingStore?: MeetingStore;
};
const store: MeetingStore = (globalStore.__meetingStore ??= { meetings: [], sequence: 0 });

export function listMockMeetings(): Meeting[] {
  return store.meetings;
}

export function findMockMeeting(id: string): Meeting | null {
  return store.meetings.find((meeting) => meeting.id === id) ?? null;
}

/**
 * 회의 생성 — 회의실 예약과 짝지어 항상 같이 만들어진다(WORKFLOW.md §3-1).
 * ⚠️ 여기서 참조 무결성(roomId·projectId·attendeeIds 존재 여부)을 다시 보지 않는다 —
 *    호출부(`rooms/actions.ts`)가 예약을 검증할 때 이미 확인했다.
 */
export function addMockMeeting(draft: MeetingDraft): Meeting {
  const meeting: Meeting = {
    ...draft,
    id: `meeting-${++store.sequence}`,
    createdAt: new Date().toISOString(),
    // 방금 잡은 회의가 끝나 있을 리 없다 — 완료는 캡처의 [회의 종료 및 제출]만 만든다(§types)
    endedAt: null,
    // 안 끝난 회의엔 분석이 없다(§types)
    aiSummaryStatus: null,
  };
  store.meetings = [...store.meetings, meeting];
  return meeting;
}

/**
 * 회의 종료 — **완료를 만드는 유일한 길**이다.
 *
 * ⚠️ 완료는 시간이 지나서 되는 게 아니라 Host가 [회의 종료 및 제출]을 눌러야 된다
 *    (WORKFLOW §3-3). 캡처 화면(#217)이 이 함수를 부르고, 시드가 완료 회의를 만들 때도 쓴다.
 * ⚠️ 한 번 적히면 되돌리지 않는다 — 종료는 비가역이다(마지막 파일 제출·분석 시작이 묶여 있다).
 */
export function endMockMeeting(id: string, endedAt: string): Meeting | null {
  const found = findMockMeeting(id);
  if (!found || found.endedAt !== null) return null;

  /*
    ⚠️ 종료와 동시에 **대기**로 들어간다. 서버가 종료 처리 안에서 분석 잡을 거는 것과 같은
       순간이다(WORKFLOW §3-3 4) — 목이 이걸 안 하면 종료 직후 카드가 "완료"로 떠서,
       실제로는 못 여는 회의록을 열 수 있는 것처럼 보인다.
  */
  const ended: Meeting = { ...found, endedAt, aiSummaryStatus: AI_SUMMARY_STATUS.PENDING };
  store.meetings = store.meetings.map((meeting) => (meeting.id === id ? ended : meeting));
  return ended;
}

/**
 * 분석 진행도를 옮긴다 — **목 전용**이다.
 *
 * ⚠️ 실서비스에서는 이 값을 프론트가 못 옮긴다. 분석은 서버가 종료 처리 안에서 돌리고
 *    화면은 `/processing-status`를 읽기만 한다(WORKFLOW §3-3 4) — 시드가 여러 단계를
 *    한 화면에 세워 보이려고 쓰는 손잡이다.
 */
export function setMockSummaryStatus(id: string, status: AiSummaryStatus): void {
  store.meetings = store.meetings.map((meeting) =>
    meeting.id === id ? { ...meeting, aiSummaryStatus: status } : meeting,
  );
}
