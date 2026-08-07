import { AUTHORITY } from "@/constants/authority";

import type { MeetingDraft } from "../types";
import { addMockMeeting, findMockMeeting, listMockMeetings } from "./meetings";

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
};

describe("회의 mock 스토어", () => {
  it("회의를 추가하면 id·생성시각을 채워 목록에 반영된다", () => {
    const before = listMockMeetings().length;

    const created = addMockMeeting(DRAFT);

    expect(created.id).toBeDefined();
    expect(created.createdAt).toBeDefined();
    expect(created.title).toBe("8월 킥오프 미팅");
    expect(listMockMeetings()).toHaveLength(before + 1);
    expect(findMockMeeting(created.id)).toEqual(created);
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
