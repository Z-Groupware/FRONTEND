import { render, screen } from "@testing-library/react";

import { AI_SUMMARY_STATUS, MEETING_STATUS } from "@/constants/meeting";

import type { MeetingListItem } from "../view-types";
import { MeetingCard } from "./meeting-card";

const BASE: MeetingListItem = {
  id: "meeting-3",
  title: "굿즈 앱 주간 운영 점검",
  status: MEETING_STATUS.SCHEDULED,
  projectTag: "GOODS",
  originLabel: "Owner 개설",
  topicSummary: "운영 · 주간 점검",
  schedule: "8월 14일(금) 10:00 – 10:30",
  roomName: "대회의실",
  attendeeCount: 4,
  isHost: true,
  aiSummaryStatus: null,
};

function renderCard(patch: Partial<MeetingListItem> = {}) {
  render(<MeetingCard meeting={{ ...BASE, ...patch }} />);
}

describe("MeetingCard — 발치 버튼", () => {
  /*
    ⚠️ **진행중이 핵심이다**(2026-08-11 고침). 판정(`meetingCardAffordanceOf`)은 예정·진행중을
       함께 `live`로 묶는데 카드가 예정만 봐서, **녹음 중 새로고침하면 목록에서 캡처로
       돌아갈 길이 없었다.**
  */
  it.each([MEETING_STATUS.SCHEDULED, MEETING_STATUS.IN_PROGRESS])(
    "%s 회의의 Host는 [녹음하기]로 캡처에 간다",
    (status) => {
      renderCard({ status });

      expect(screen.getByRole("link", { name: "녹음하기" })).toHaveAttribute(
        "href",
        "/app/meeting/meeting-3/capture",
      );
    },
  );

  it("예정 회의의 참석자에게는 아무것도 안 준다 — 아직 남긴 것이 없다", () => {
    renderCard({ isHost: false });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("진행중 회의의 참석자는 회의록으로 간다 — 빈 카드는 죽은 카드로 보인다", () => {
    renderCard({ status: MEETING_STATUS.IN_PROGRESS, isHost: false });

    expect(screen.getByRole("link", { name: /회의록/ })).toHaveAttribute(
      "href",
      "/app/meeting/meeting-3",
    );
  });

  it("검토가 밀린 완료 회의는 Host에게 [액션 검토]를 준다 — 회의록보다 급하다", () => {
    renderCard({
      status: MEETING_STATUS.DONE,
      aiSummaryStatus: AI_SUMMARY_STATUS.REVIEWED,
    });

    expect(screen.getByRole("link", { name: "액션 검토" })).toHaveAttribute(
      "href",
      "/app/meeting/meeting-3/review",
    );
  });
});
