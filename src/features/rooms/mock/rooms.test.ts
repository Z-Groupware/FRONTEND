import { addMockRoom, findMockRoom, listMockRooms, updateMockRoom } from "./rooms";

const DRAFT = {
  name: "  신관 세미나실  ",
  location: "  4층 C동  ",
  openTime: "10:00",
  closeTime: "17:00",
};

describe("회의실 mock 스토어", () => {
  it("시드 데이터가 최소 한 곳 있다", () => {
    expect(listMockRooms().length).toBeGreaterThan(0);
  });

  it("회의실을 추가하면 앞뒤 공백을 지우고 목록에 반영된다", () => {
    const before = listMockRooms().length;

    const created = addMockRoom(DRAFT);

    expect(created.name).toBe("신관 세미나실");
    expect(created.location).toBe("4층 C동");
    expect(listMockRooms()).toHaveLength(before + 1);
    expect(findMockRoom(created.id)).toEqual(created);
  });

  it("회의실을 수정하면 그 id의 값만 바뀐다", () => {
    const created = addMockRoom(DRAFT);

    const updated = updateMockRoom(created.id, { ...DRAFT, name: "신관 세미나실(개편)" });

    expect(updated?.id).toBe(created.id);
    expect(updated?.name).toBe("신관 세미나실(개편)");
    expect(findMockRoom(created.id)?.name).toBe("신관 세미나실(개편)");
  });

  it("없는 id를 수정하려 하면 null을 돌려준다", () => {
    expect(updateMockRoom("존재하지-않음", DRAFT)).toBeNull();
  });

  it("없는 id는 조회 시 null을 돌려준다", () => {
    expect(findMockRoom("존재하지-않음")).toBeNull();
  });
});
