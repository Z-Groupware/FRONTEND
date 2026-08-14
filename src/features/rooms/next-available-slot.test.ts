import { getDefaultSlotForWeek, getNextAvailableSlot } from "./next-available-slot";

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

describe("getDefaultSlotForWeek", () => {
  it("보고 있는 주가 이번 주면 getNextAvailableSlot과 같은 값을 준다", () => {
    // 2026-08-11(화)는 월요일이 2026-08-10인 주에 속한다.
    const now = new Date("2026-08-11T10:12:00");
    const slot = getDefaultSlotForWeek("2026-08-10", now);
    expect(slot).toEqual(getNextAvailableSlot(now));
  });

  it("보고 있는 주가 다른 주면 '지금'을 안 쓰고 그 주 월요일 09:00을 연다", () => {
    // 2026-08-20(목)은 월요일이 2026-08-17인 주다 — 2026-08-10 주와 다르다.
    const now = new Date("2026-08-20T15:00:00");
    const slot = getDefaultSlotForWeek("2026-08-10", now);
    expect(slot).toEqual(new Date("2026-08-10T09:00:00"));
  });
});
