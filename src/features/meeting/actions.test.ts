// 서버 액션은 next 런타임 함수를 부른다 — jsdom엔 없으니 목으로 대체하고 호출만 검증한다.
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
// isMock은 NEXT_PUBLIC_USE_MOCK 환경변수로 정해진다 — 테스트가 환경에 휘둘리지 않게 고정한다.
jest.mock("@/mocks/config", () => ({ isMock: true }));
// 기본은 실제 getMockActor()와 같은 값(OWNER, Admin 아님) — `canManageMeeting`이 OWNER를
// 통과시키므로 host가 아닌 회의도 고칠 수 있다(MEET-09 계약: host·OWNER·ADMIN).
jest.mock("@/lib/mock-actor", () => ({
  getMockActor: jest.fn(() => ({ id: 1, role: "OWNER" })),
}));

import { updateMeetingAttendeesAction } from "./actions";
import { addMockMeeting } from "./mock/meetings";
import type { MeetingDraft } from "./types";

const INITIAL = { error: null, attendeeIds: null } as const;

/*
  참석자 명부는 `features/rooms/mock/members.ts`다:
    1 박대표(OWNER, 팀 없음) · 2 김서준(개발팀 LEADER) · 3 이하윤(개발팀 MEMBER)
    5 최유진(마케팅팀 LEADER) · 7 강서연(디자인팀 LEADER)
*/
const BASE = {
  title: "테스트 회의",
  roomId: "room-small-b",
  roomName: "소회의실 B",
  projectId: 1,
  projectTag: "GOODS",
  topics: [{ main: "제품", sub: "로드맵 검토" }] as [{ main: string; sub: string }],
  roomReservationId: "reservation-test",
} as const;

/** 아직 안 끝난(예정) 회의를 하나 만든다 — 끝난 회의는 교체 자체가 막힌다. */
function seedMeeting(extra: Partial<MeetingDraft> & Pick<MeetingDraft, "hostAuthority">) {
  const start = new Date(Date.now() + 60 * 60_000);
  const end = new Date(start.getTime() + 30 * 60_000);
  return addMockMeeting({
    ...BASE,
    start,
    end,
    hostId: 1,
    attendeeIds: [1],
    ...extra,
  } as MeetingDraft);
}

const form = (meetingId: string, attendeeIds: number[]) => {
  const data = new FormData();
  data.append("meetingId", meetingId);
  for (const id of attendeeIds) data.append("attendeeIds", String(id));
  return data;
};

/*
  ⚠️ 참석자 범위 강제(2026-08-13)는 **개설만이 아니라 교체(MEET-09)에도** 걸린다 — 개설만 막고
     교체를 열어 두면 만든 뒤에 규칙을 깨서 넣을 수 있고, "Owner 개설 회의의 참석자는 전부
     팀장"이라는 AI 팀 액션 판단 근거가 똑같이 무너진다.
*/
describe("참석자 교체(MEET-09) — 범위 재검증", () => {
  it("Owner 개설 회의는 팀장만 받는다", async () => {
    const meeting = seedMeeting({ hostAuthority: "OWNER" });

    const result = await updateMeetingAttendeesAction(INITIAL, form(meeting.id, [2, 5]));

    expect(result.error).toBeNull();
    expect(result.attendeeIds).toEqual([2, 5, 1]);
  });

  it("Owner 개설 회의에 사원을 끼워 넣으면 막는다", async () => {
    const meeting = seedMeeting({ hostAuthority: "OWNER" });

    const result = await updateMeetingAttendeesAction(INITIAL, form(meeting.id, [2, 3]));

    expect(result.error).toBe("Owner가 개설하는 회의에는 팀장만 참석자로 지정할 수 있습니다");
    expect(result.attendeeIds).toBeNull();
  });

  it("범위 기준은 액터가 아니라 **그 회의의 host**다 — Owner가 팀 회의를 고쳐도 host의 팀으로 잰다", async () => {
    // host = 김서준(id=2, 개발팀 LEADER). 액터는 OWNER지만 "팀장만"이 아니라 "개발팀만"이 걸린다.
    const meeting = seedMeeting({
      hostAuthority: "LEADER",
      hostId: 2,
      hostTeamId: 7,
      parentTeamActionId: 1,
      attendeeIds: [2],
    });

    const passed = await updateMeetingAttendeesAction(INITIAL, form(meeting.id, [3]));
    expect(passed.error).toBeNull();

    const blocked = await updateMeetingAttendeesAction(INITIAL, form(meeting.id, [5]));
    expect(blocked.error).toBe("자기 팀 소속만 참석자로 지정할 수 있습니다");
  });

  it("현재 명단에 들어 있는 host는 위반으로 세지 않는다(화면을 열기만 해도 막히면 안 된다)", async () => {
    const meeting = seedMeeting({ hostAuthority: "OWNER" });

    // 다이얼로그는 현재 명단(host 포함)을 그대로 초기 선택으로 들고 연다.
    const result = await updateMeetingAttendeesAction(INITIAL, form(meeting.id, [1, 2]));

    expect(result.error).toBeNull();
  });

  it("존재하지 않는 참석자 id는 막는다(폼 조작 방어)", async () => {
    const meeting = seedMeeting({ hostAuthority: "OWNER" });

    const result = await updateMeetingAttendeesAction(INITIAL, form(meeting.id, [9999]));

    expect(result.error).toBe("존재하지 않는 참석자가 있습니다");
  });
});
