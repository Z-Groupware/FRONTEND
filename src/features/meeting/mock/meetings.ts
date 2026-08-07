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
  };
  store.meetings = [...store.meetings, meeting];
  return meeting;
}
