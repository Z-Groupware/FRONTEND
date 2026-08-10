import { getNextAvailableSlot } from "./next-available-slot";

describe("getNextAvailableSlot", () => {
  it("30분 단위가 아니면 다음 30분 경계로 올린다", () => {
    const slot = getNextAvailableSlot(new Date("2026-08-11T10:12:00"));
    expect(slot).toEqual(new Date("2026-08-11T10:30:00"));
  });

  it("이미 30분 경계면 그대로 둔다", () => {
    const slot = getNextAvailableSlot(new Date("2026-08-11T10:30:00"));
    expect(slot).toEqual(new Date("2026-08-11T10:30:00"));
  });

  it("운영 시간 전이면 같은 날 09:00으로 당긴다", () => {
    const slot = getNextAvailableSlot(new Date("2026-08-11T07:40:00"));
    expect(slot).toEqual(new Date("2026-08-11T09:00:00"));
  });

  it("마감 30분을 못 채우면 다음 날 09:00으로 넘긴다", () => {
    const slot = getNextAvailableSlot(new Date("2026-08-11T17:45:00"));
    expect(slot).toEqual(new Date("2026-08-12T09:00:00"));
  });

  it("운영 종료 시각이면 다음 날로 넘긴다", () => {
    const slot = getNextAvailableSlot(new Date("2026-08-11T18:00:00"));
    expect(slot).toEqual(new Date("2026-08-12T09:00:00"));
  });
});
