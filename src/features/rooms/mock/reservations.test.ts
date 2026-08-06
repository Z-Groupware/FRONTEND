import {
  addMockReservation,
  findMockReservation,
  listMockReservations,
  listMockReservationsByRoom,
} from "./reservations";

const DRAFT = {
  title: "  신규 회의  ",
  roomId: "room-small-b",
  date: "2026-08-10",
  startTime: "10:30",
  projectId: "1", // TOP_LEVEL_PROJECTS의 GOODS(id=1)
  topicMain: "PRODUCT",
  topicSub: "ROADMAP_REVIEW",
  attendeeIds: [1, 2],
};

describe("회의실 예약 mock 스토어", () => {
  it("시드 데이터가 회의실별로 최소 한 건씩 있다", () => {
    expect(listMockReservationsByRoom("room-large").length).toBeGreaterThan(0);
  });

  it("예약을 추가하면 앞뒤 공백을 지우고 회의실 이름·소주제 라벨·프로젝트 태그를 채운다", () => {
    const before = listMockReservations().length;

    const created = addMockReservation(DRAFT, 3);

    expect(created.title).toBe("신규 회의");
    expect(created.roomName).toBe("소회의실 B");
    expect(created.topicSub).toBe("로드맵 검토");
    expect(created.projectTag).toBe("GOODS");
    expect(created.ownerId).toBe(3);
    // 시작 10:30 + 고정 30분 = 종료 11:00
    expect(created.end.getTime() - created.start.getTime()).toBe(30 * 60_000);
    expect(listMockReservations()).toHaveLength(before + 1);
    expect(findMockReservation(created.id)).toEqual(created);
  });

  it("프로젝트에 안 묶인 예약은 projectTag 없이 만들어진다", () => {
    const created = addMockReservation({ ...DRAFT, projectId: undefined }, 3);
    expect(created.projectId).toBeUndefined();
    expect(created.projectTag).toBeUndefined();
  });

  it("없는 id는 조회 시 null을 돌려준다", () => {
    expect(findMockReservation("존재하지-않음")).toBeNull();
  });
});
