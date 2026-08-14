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

  /* 2026-08-14는 금요일 — 마감 넘겨 넘어가면 "다음 날"이 토요일(08-15)이라 그대로 두면 안 된다. */
  it("금요일 마감 뒤엔 주말을 건너 월요일 09:00으로 넘긴다", () => {
    const slot = getNextAvailableSlot(new Date("2026-08-14T17:45:00"));
    expect(slot).toEqual(new Date("2026-08-17T09:00:00"));
  });

  /* 2026-08-15는 토요일 — 주말에 눌러도 결과는 평일이어야 한다. */
  it("토요일에 누르면 월요일 09:00으로 넘긴다", () => {
    const slot = getNextAvailableSlot(new Date("2026-08-15T10:00:00"));
    expect(slot).toEqual(new Date("2026-08-17T09:00:00"));
  });

  /* 2026-08-16은 일요일. */
  it("일요일에 누르면 월요일 09:00으로 넘긴다", () => {
    const slot = getNextAvailableSlot(new Date("2026-08-16T14:00:00"));
    expect(slot).toEqual(new Date("2026-08-17T09:00:00"));
  });
});
