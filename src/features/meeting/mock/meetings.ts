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
    // 방금 잡은 회의가 취소돼 있을 리 없다(§types)
    canceledAt: null,
    // 안 끝난 회의엔 분석이 없다(§types)
    aiSummaryStatus: null,
  };
  store.meetings = [...store.meetings, meeting];
  return meeting;
}

/**
 * 비대면 회의 생성(이슈 #473) — **만들어지는 순간 이미 완료다**("제출하면 그 자리에서 완료
 * 처리 — 캡처 화면으로 안 넘어갑니다", 팀 명세). `addMockMeeting`과 인자 모양은 같지만
 * (판별식 유니언 조립은 호출부인 `actions.ts`가 한다, `rooms/mock/reservations.ts`와 같은
 * 자리 나눔) 저장 직전에 "이미 끝났다"는 사실을 덧씌운다.
 * ⚠️ **`start`·`end`가 없다.** 비대면 회의는 잡을 시간 자체가 없어(`OnlineMeetingDraft`에
 *    `date`·`startTime`이 없다) 방금 완료된 시각을 그대로 쓴다 — 예정·진행중을 거치지 않는다.
 * ⚠️ `roomId`·`roomName`·`roomReservationId`는 draft에서부터 이미 `null`이다(회의실이 없다) —
 *    여기서 다시 지우지 않는다.
 * ⚠️ **분석 대기(`PENDING`)로 안 들어간다**(2026-08-14 팀 확정, 대면 회의의 `endMockMeeting`과
 *    다른 점). 대면 회의는 종료와 동시에 서버가 분석을 큐에 걸지만, 비대면 회의는 만들자마자
 *    끝나 있어 녹음 파일 자체가 없다 — 요약 요청은 다이얼로그 2단계([AI 요약 요청])에서
 *    사람이 직접 눌러야 시작된다(`setMockSummaryStatus`가 그때 `PENDING`으로 옮긴다). 그래서
 *    여기서는 `null`("아직 요청 안 함")로 둔다.
 */
export function addMockOnlineMeeting(draft: MeetingDraft): Meeting {
  const now = new Date();
  const meeting: Meeting = {
    ...draft,
    start: now,
    end: now,
    id: `meeting-${++store.sequence}`,
    createdAt: now.toISOString(),
    // 캡처를 거치지 않고 제출과 동시에 끝난다 — endMockMeeting을 따로 부르지 않는다.
    endedAt: now.toISOString(),
    canceledAt: null,
    // 아직 요약을 요청하지 않았다 — 위 주석 참고.
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
 * 회의 취소(MEET-06) — **시작 전 회의만** 가능. 물리 삭제하지 않는다.
 *
 * ⚠️ 이미 시작(`endedAt`·진행중)했으면 취소가 아니라 종료(MEET-08)를 쓴다 — 상태 판정
 *    (`meetingStatusOf`)은 호출부(`actions.ts`)가 먼저 하고 온다(참조 무결성 재확인과 같은
 *    자리 나눔, `updateMockMeetingAttendees`와 같은 패턴).
 * ⚠️ 한 번 취소되면 되돌리지 않는다 — 다시 열려면 새 회의를 개설해야 한다.
 */
export function cancelMockMeeting(id: string, canceledAt: string): Meeting | null {
  const found = findMockMeeting(id);
  if (!found || found.canceledAt !== null) return null;

  const canceled: Meeting = { ...found, canceledAt };
  store.meetings = store.meetings.map((meeting) => (meeting.id === id ? canceled : meeting));
  return canceled;
}

/**
 * 참석자 명단 교체(MEET-09) — **전체 명단 교체**다(부분 추가·삭제가 아니다).
 * ⚠️ **host는 자동 포함·제거 불가**다 — 넘어온 목록에 없어도 여기서 끼워 넣는다
 *    (호출부가 이미 그렇게 보내더라도, 이 함수가 마지막 안전판이다).
 * ⚠️ 중복은 여기서 한 번만 남긴다("서버에서 한 번만 저장", MEET-09 규칙).
 * ⚠️ 끝난 회의는 여기서 막지 않는다 — 상태 판정(`meetingStatusOf`)은 호출부(`actions.ts`)가
 *    이미 하고 온 뒤에만 이 함수를 부른다(참조 무결성 재확인과 같은 자리 나눔).
 */
export function updateMockMeetingAttendees(id: string, attendeeIds: number[]): Meeting | null {
  const found = findMockMeeting(id);
  if (!found) return null;

  const merged = Array.from(new Set([...attendeeIds, found.hostId]));
  const updated: Meeting = { ...found, attendeeIds: merged };
  store.meetings = store.meetings.map((meeting) => (meeting.id === id ? updated : meeting));
  return updated;
}

/**
 * 회의 정보 수정(MEET-05) — **보낸 값만 갈아 끼운다**(부분 수정).
 *
 * ⚠️ 지금 화면이 보내는 건 제목뿐이다. BE는 프로젝트·회의실·시간·녹음 동의도 받지만
 *    (`UpdateMeetingRequest`) 그쪽은 예약 슬롯을 다시 잡는 일이라 회의실 예약 화면의
 *    슬롯 피커가 있어야 한다 — **안 붙인 필드를 받는 척하지 않는다**(§정직성).
 * ⚠️ 상태 판정(`meetingStatusOf`)은 호출부(`actions.ts`)가 이미 하고 온다 —
 *    `cancelMockMeeting`·`updateMockMeetingAttendees`와 같은 자리 나눔이다.
 */
export function updateMockMeeting(id: string, patch: { title: string }): Meeting | null {
  const found = findMockMeeting(id);
  if (!found) return null;

  const updated: Meeting = { ...found, title: patch.title };
  store.meetings = store.meetings.map((meeting) => (meeting.id === id ? updated : meeting));
  return updated;
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

/**
 * 비대면 회의 다이얼로그 2단계([녹음 파일 제출])가 파일명을 적어 둔다(이슈 #473, 2026-08-14).
 * ⚠️ **여기서도 바이트는 안 든다** — 파일명만 옮긴다(§정직한 목업, `Meeting.recordingFileName`
 *    주석과 같은 사정). `.map()`으로 훑다가 `id`가 맞는 회의만 바꿔 끼운다 — 맞는 회의가
 *    없으면 `store.meetings`는 그대로고, 던지거나 알리지도 않는다(호출부가 이미
 *    `findMockMeeting`으로 존재를 확인하고 부른다는 전제).
 */
export function setMockRecordingFileName(id: string, fileName: string): void {
  store.meetings = store.meetings.map((meeting) =>
    meeting.id === id ? { ...meeting, recordingFileName: fileName } : meeting,
  );
}
