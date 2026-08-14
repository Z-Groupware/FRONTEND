import { AUTHORITY } from "@/constants/authority";
import { AI_SUMMARY_STATUS } from "@/constants/meeting";

import type { MeetingDraft } from "../types";
import {
  addMockMeeting,
  addMockOnlineMeeting,
  findMockMeeting,
  listMockMeetings,
  setMockRecordingFileName,
  setMockSummaryStatus,
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
    // ⚠️ `createOnlineMeetingAction`은 항상 `null`로 만든다 — 첨부는 이 액션의 몫이 아니라
    //    다이얼로그 **2단계**(`submitOnlineMeetingRecordingAction`)가 따로 붙인다(actions.ts 주석).
    recordingFileName: null,
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

  it("취소되지 않은 채로 만들어진다", () => {
    const created = addMockOnlineMeeting(ONLINE_DRAFT);

    expect(created.canceledAt).toBeNull();
  });

  /*
    ⚠️ 실제 2단계 흐름 재현(이슈 #473, 2026-08-14) — 1단계(`createOnlineMeetingAction`이
       부르는 `addMockOnlineMeeting`)는 녹음 파일 없이 회의를 만들고, 2단계
       (`submitOnlineMeetingRecordingAction`)가 `setMockRecordingFileName`으로 파일명을
       따로 붙인다. 한 함수만 따로 테스트하면 두 단계가 실제로 이어지는지는 안 잡힌다.
  */
  describe("2단계([녹음 파일 제출]) — setMockRecordingFileName", () => {
    it("만들어질 때는 녹음 파일이 없다", () => {
      const created = addMockOnlineMeeting(ONLINE_DRAFT);

      expect(created.recordingFileName).toBeNull();
    });

    it("setMockRecordingFileName을 부르면 파일명이 그 회의에 붙는다(§정직한 목업 — 이름만 옮긴다)", () => {
      const created = addMockOnlineMeeting(ONLINE_DRAFT);

      setMockRecordingFileName(created.id, "회의록.m4a");

      expect(findMockMeeting(created.id)?.recordingFileName).toBe("회의록.m4a");
    });

    it("파일 제출과 함께 분석 대기(PENDING)로 옮겨진다", () => {
      const created = addMockOnlineMeeting(ONLINE_DRAFT);

      setMockRecordingFileName(created.id, "회의록.m4a");
      setMockSummaryStatus(created.id, AI_SUMMARY_STATUS.PENDING);

      expect(findMockMeeting(created.id)?.aiSummaryStatus).toBe(AI_SUMMARY_STATUS.PENDING);
    });
  });
});
