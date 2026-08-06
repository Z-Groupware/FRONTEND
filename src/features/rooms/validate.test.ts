import { validateRoomReservationDraft } from "./validate";

const VALID_DRAFT = {
  title: "주간 싱크",
  roomId: "room-large",
  date: "2026-08-10",
  startTime: "10:00",
  projectId: "p-goods",
  topicMain: "PRODUCT",
  topicSub: "ROADMAP_REVIEW",
  attendeeIds: [1],
};

describe("회의실 예약 검증", () => {
  it("전부 채우면 통과한다", () => {
    expect(validateRoomReservationDraft(VALID_DRAFT)).toEqual({});
  });

  it("제목이 비면 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, title: "   " });
    expect(errors.title).toBe("회의 제목을 입력해 주세요");
  });

  it("회의실을 안 고르면 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, roomId: "" });
    expect(errors.roomId).toBeDefined();
  });

  it("날짜 형식이 아니면 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, date: "2026/08/10" });
    expect(errors.date).toBe("올바른 날짜가 아니에요");
  });

  it("존재하지 않는 날짜는 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, date: "2026-02-30" });
    expect(errors.date).toBe("올바른 날짜가 아니에요");
  });

  it("30분 단위가 아닌 시작 시각은 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, startTime: "10:15" });
    expect(errors.startTime).toBe("예약은 30분 단위로만 가능해요");
  });

  it("운영 시작(09:00) 이전은 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, startTime: "08:30" });
    expect(errors.startTime).toBe("회의실 운영 시간(09:00~18:00) 안에서 선택해 주세요");
  });

  it("30분을 더하면 운영 종료(18:00)를 넘는 시작 시각은 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, startTime: "17:45" });
    expect(errors.startTime).toBeDefined();
  });

  it("운영 종료 딱 맞춰 끝나는 17:30 시작은 통과한다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, startTime: "17:30" });
    expect(errors.startTime).toBeUndefined();
  });

  it("프로젝트를 안 고르면 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, projectId: undefined });
    expect(errors.projectId).toBe("프로젝트를 선택해 주세요");
  });

  it("대주제를 안 고르면 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, topicMain: "" });
    expect(errors.topicMain).toBeDefined();
  });

  it("소주제를 안 고르면 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, topicSub: "" });
    expect(errors.topicSub).toBeDefined();
  });

  it("참석자가 한 명도 없으면 막는다", () => {
    const errors = validateRoomReservationDraft({ ...VALID_DRAFT, attendeeIds: [] });
    expect(errors.attendeeIds).toBe("참석자를 한 명 이상 선택해 주세요");
  });
});
