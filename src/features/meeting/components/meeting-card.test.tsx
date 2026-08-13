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

/**
 * 둘째 줄(소속 라벨 · 안건) — **빈 조각은 가운뎃점째 뺀다.**
 *
 * ⚠️ BE #461 배포 전 목록엔 소속 팀도 안건도 없어 **둘 다 빈 문자열**로 온다(§mapper) —
 *    그대로 이으면 이 줄에 홀로 남은 `·` 하나만 그려진다. 배포 뒤에는 값이 실제로 차므로
 *    **두 경우를 다 고정해 둔다** — 한쪽만 보면 나중에 조건이 뒤집혀도 안 걸린다.
 */
describe("MeetingCard — 둘째 줄", () => {
  it("소속 라벨과 안건이 다 있으면 가운뎃점으로 잇는다", () => {
    renderCard();

    /* ⚠️ 가운뎃점 양옆은 글자가 아니라 여백(`px-1.5`)이라 텍스트로는 붙어 나온다 */
    expect(screen.getByText(/Owner 개설/)).toHaveTextContent("Owner 개설·운영 · 주간 점검");
  });

  it.each([
    ["소속 라벨만 있으면", { originLabel: "Owner 개설", topicSummary: "" }],
    ["안건만 있으면", { originLabel: "", topicSummary: "운영 · 주간 점검" }],
  ])("%s 앞뒤에 가운뎃점을 안 붙인다", (_label, patch) => {
    renderCard(patch);

    const line = screen.getByText(patch.originLabel || patch.topicSummary);
    expect(line.textContent?.trim()).toBe(patch.originLabel || patch.topicSummary);
  });

  it("둘 다 없으면 가운뎃점만 남기지 않는다 — #461 배포 전 목록이 이 모양이다", () => {
    renderCard({ originLabel: "", topicSummary: "" });

    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });

  /*
    ⚠️ **빈 `<p>`도 남기지 않는다**(2026-08-13, 코드래빗 지적). 예전엔 조건 없이 `<p>`를
       그려서 `pt-1.5 pb-6`이 살아 있었는데, 카드 발치와의 간격이 늘어 밑에 침묵의 여백이
       생겼다 — 픽셀도 없는 것을 말하면 안 된다.
  */
  it("둘 다 없으면 소속·안건 줄 자체를 안 그린다", () => {
    const { container } = render(
      <MeetingCard meeting={{ ...BASE, originLabel: "", topicSummary: "" }} />,
    );

    expect(container.querySelector("p.text-muted-foreground")).toBeNull();
  });
});
