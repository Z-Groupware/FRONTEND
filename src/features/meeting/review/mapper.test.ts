import { type BePendingActionDistributionMeeting, toPendingReviewSummary } from "./mapper";

/** MEET-10 응답 그대로 — 필드 이름을 BE 실코드에 맞춰 둔다 */
const BASE: BePendingActionDistributionMeeting = {
  meetingId: 13,
  title: "주간 백엔드 회의",
  status: "DONE",
  startAt: "2026-08-07T14:00:00",
  pendingActionCount: 3,
  project: { projectId: 12, tag: "Z-GROUPWARE", name: "잇다 그룹웨어" },
};

describe("toPendingReviewSummary", () => {
  it("id를 문자열로 바꾸고 화면이 쓰는 필드만 남긴다", () => {
    expect(toPendingReviewSummary(BASE)).toEqual({
      meetingId: "13",
      meetingTitle: "주간 백엔드 회의",
      actionCount: 3,
    });
  });
});
