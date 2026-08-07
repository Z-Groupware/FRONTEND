import { MEETING_STATUS } from "@/constants/meeting";

import { meetingStatusOf } from "./status";

/** 상태가 틀리면 "완료 카드만 상세 진입" 규칙(WORKFLOW §3-2)이 통째로 틀린다 */
describe("meetingStatusOf", () => {
  const start = new Date("2026-08-11T13:00:00");

  it("시작 전이면 예정이다", () => {
    expect(meetingStatusOf({ start, endedAt: null }, new Date("2026-08-11T12:59:00"))).toBe(
      MEETING_STATUS.SCHEDULED,
    );
  });

  it("시작 시각부터는 진행중이다", () => {
    expect(meetingStatusOf({ start, endedAt: null }, new Date("2026-08-11T13:00:00"))).toBe(
      MEETING_STATUS.IN_PROGRESS,
    );
  });

  /*
    ⚠️ 예약한 30분이 지나도 완료가 아니다 — 회의가 길어진 것일 수 있다. 시간으로 완료를
       만들면 스크립트도 산출물도 없는 회의가 "완료 카드"로 열린다.
  */
  it("끝나는 시각이 지나도 종료를 안 눌렀으면 진행중이다", () => {
    expect(meetingStatusOf({ start, endedAt: null }, new Date("2026-08-11T18:00:00"))).toBe(
      MEETING_STATUS.IN_PROGRESS,
    );
  });

  it("종료를 눌렀으면 시각과 무관하게 완료다", () => {
    expect(
      meetingStatusOf(
        { start, endedAt: "2026-08-11T13:28:00.000Z" },
        new Date("2026-08-11T13:10:00"),
      ),
    ).toBe(MEETING_STATUS.DONE);
  });
});
