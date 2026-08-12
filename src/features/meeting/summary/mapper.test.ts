import { type BeStalledSummaryMeeting, toStalledSummaryInfo } from "./mapper";

/** MEET-15 응답 원소 그대로 — 필드 이름을 BE 실코드에 맞춰 둔다 */
const BASE: BeStalledSummaryMeeting = {
  meetingId: 30,
  title: "9월 스프린트 리뷰",
  isStalled: true,
};

describe("toStalledSummaryInfo", () => {
  it("id를 문자열로 바꾸고 화면이 쓰는 필드만 남긴다", () => {
    expect(toStalledSummaryInfo(BASE)).toEqual({
      meetingId: "30",
      meetingTitle: "9월 스프린트 리뷰",
      isStalled: true,
    });
  });

  it("isStalled가 false면 그대로 옮긴다 — 문구는 화면(StalledSummaryList)이 가른다", () => {
    expect(toStalledSummaryInfo({ ...BASE, isStalled: false }).isStalled).toBe(false);
  });
});
