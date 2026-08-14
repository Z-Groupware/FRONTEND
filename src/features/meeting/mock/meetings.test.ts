import { AUTHORITY } from "@/constants/authority";

import type { MeetingDraft } from "../types";
import {
  addMockMeeting,
  addMockOnlineMeeting,
  findMockMeeting,
  listMockMeetings,
} from "./meetings";

const DRAFT: MeetingDraft = {
  title: "8월 킥오프 미팅",
  start: new Date("2026-08-11T13:00:00"),
  end: new Date("2026-08-11T13:30:00"),
  roomId: "room-large",
  roomName: "대회의실",
  projectId: 1,
  projectTag: "GOODS",
  topics: [{ main: "제품", sub: "킥오프" }],
  attendeeIds: [1, 2, 3],
  hostId: 1,
  hostAuthority: AUTHORITY.OWNER,
  roomReservationId: "reservation-1",
  isOnline: false,
  recordingFileName: null,
};

describe("회의 mock 스토어", () => {
  it("회의를 추가하면 id·생성시각을 채워 목록에 반영된다", () => {
    const before = listMockMeetings().length;

    const created = addMockMeeting(DRAFT);

    expect(created.id).toMatch(/^meeting-\d+$/);
    expect(created.createdAt).toBe(new Date(created.createdAt).toISOString());
    expect(created.title).toBe("8월 킥오프 미팅");
    expect(listMockMeetings()).toHaveLength(before + 1);
    expect(findMockMeeting(created.id)).toEqual(created);
  });

  it("연달아 추가하면 id 뒷자리가 순서대로 늘어난다", () => {
    const first = addMockMeeting(DRAFT);
    const second = addMockMeeting(DRAFT);

    const firstSeq = Number(first.id.replace("meeting-", ""));
    const secondSeq = Number(second.id.replace("meeting-", ""));
    expect(secondSeq).toBe(firstSeq + 1);
  });

  it("팀 액션 회의는 parentTeamActionId·hostTeamId를 그대로 담는다", () => {
    const created = addMockMeeting({
      ...DRAFT,
      hostAuthority: AUTHORITY.LEADER,
      hostTeamId: 7,
      parentTeamActionId: 2,
    });

    expect(created.parentTeamActionId).toBe(2);
    expect(created.hostTeamId).toBe(7);
  });

  it("없는 id는 조회 시 null을 돌려준다", () => {
    expect(findMockMeeting("존재하지-않음")).toBeNull();
  });
});

describe("비대면 회의 생성(이슈 #473) — addMockOnlineMeeting", () => {
  const ONLINE_DRAFT: MeetingDraft = {
    ...DRAFT,
    isOnline: true,
    roomId: null,
    roomName: null,
    roomReservationId: null,
    recordingFileName: "회의록.m4a",
  };

  it("만들자마자 종료 처리된다 — endedAt이 즉시 채워진다", () => {
    const created = addMockOnlineMeeting(ONLINE_DRAFT);

    expect(created.isOnline).toBe(true);
    expect(created.endedAt).not.toBeNull();
    expect(created.endedAt).toBe(new Date(created.endedAt!).toISOString());
  });

  /*
    ⚠️ 2026-08-14 팀 확정 — 대면 회의의 `endMockMeeting`과 달리 **대기로 안 들어간다.** 요약
       요청은 다이얼로그 2단계([AI 요약 요청])에서 사람이 직접 눌러야 시작된다.
  */
  it("만들어진 시점엔 아직 AI 요약을 요청하지 않은 상태다", () => {
    const created = addMockOnlineMeeting(ONLINE_DRAFT);

    expect(created.aiSummaryStatus).toBeNull();
  });

  it("회의실이 없다 — roomId·roomName·roomReservationId가 그대로 null이다", () => {
    const created = addMockOnlineMeeting(ONLINE_DRAFT);

    expect(created.roomId).toBeNull();
    expect(created.roomName).toBeNull();
    expect(created.roomReservationId).toBeNull();
  });

  it("첨부한 녹음 파일 이름을 그대로 담는다(§정직한 목업 — 바이트는 안 든다)", () => {
    const created = addMockOnlineMeeting(ONLINE_DRAFT);

    expect(created.recordingFileName).toBe("회의록.m4a");
  });

  it("취소되지 않은 채로 만들어진다", () => {
    const created = addMockOnlineMeeting(ONLINE_DRAFT);

    expect(created.canceledAt).toBeNull();
  });
});
