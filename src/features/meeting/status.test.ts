import { AI_SUMMARY_STATUS, MEETING_STATUS } from "@/constants/meeting";

import { meetingCardAffordanceOf, meetingStatusOf } from "./status";

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

describe("meetingCardAffordanceOf", () => {
  const base = { status: MEETING_STATUS.DONE, isHost: true } as const;

  it("예정·진행중은 분석 값과 무관하게 live다", () => {
    expect(
      meetingCardAffordanceOf({ ...base, status: MEETING_STATUS.SCHEDULED, aiSummaryStatus: null }),
    ).toBe("live");
    expect(
      meetingCardAffordanceOf({
        ...base,
        status: MEETING_STATUS.IN_PROGRESS,
        aiSummaryStatus: null,
      }),
    ).toBe("live");
  });

  it("종료 직후(대기·요약 중)는 상세를 안 연다", () => {
    expect(meetingCardAffordanceOf({ ...base, aiSummaryStatus: AI_SUMMARY_STATUS.PENDING })).toBe(
      "summarizing",
    );
    expect(
      meetingCardAffordanceOf({ ...base, aiSummaryStatus: AI_SUMMARY_STATUS.SUMMARIZING }),
    ).toBe("summarizing");
  });

  it("검토는 Host만 — 참석자에겐 기다리라고만 한다", () => {
    expect(meetingCardAffordanceOf({ ...base, aiSummaryStatus: AI_SUMMARY_STATUS.REVIEWED })).toBe(
      "review",
    );

    expect(
      meetingCardAffordanceOf({
        ...base,
        isHost: false,
        aiSummaryStatus: AI_SUMMARY_STATUS.REVIEWED,
      }),
    ).toBe("summarizing");
  });

  it("요약 실패는 Host든 아니든 같은 말을 한다 — 다시 돌리는 자리는 마이페이지다", () => {
    expect(meetingCardAffordanceOf({ ...base, aiSummaryStatus: AI_SUMMARY_STATUS.FAILED })).toBe(
      "failed",
    );
    expect(
      meetingCardAffordanceOf({
        ...base,
        isHost: false,
        aiSummaryStatus: AI_SUMMARY_STATUS.FAILED,
      }),
    ).toBe("failed");
  });

  it("분배까지 끝나야 회의록이 열린다", () => {
    expect(
      meetingCardAffordanceOf({ ...base, aiSummaryStatus: AI_SUMMARY_STATUS.DISTRIBUTED }),
    ).toBe("open");
  });

  it("분석 값이 빈 옛 완료 회의는 막지 않는다", () => {
    expect(meetingCardAffordanceOf({ ...base, aiSummaryStatus: null })).toBe("open");
  });
});
