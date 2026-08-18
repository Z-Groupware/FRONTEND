jest.mock("@/features/meeting/actions", () => ({
  getMeetingSummaryAction: jest.fn(),
  updateMeetingAction: jest.fn(),
  cancelMeetingAction: jest.fn(),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  cancelMeetingAction,
  getMeetingSummaryAction,
  type MeetingSummary,
} from "@/features/meeting/actions";

import { RoomMeetingDetailDialog } from "./room-meeting-detail-dialog";

const SUMMARY: MeetingSummary = {
  id: "meeting-1",
  title: "주간 스크럼",
  schedule: "8월 15일(토) 10:00~10:30",
  roomName: "대회의실",
  attendees: [{ id: 1, name: "김서준", isResigned: false }],
  agenda: null,
  isHost: true,
  pendingReason: "SCHEDULED",
};

describe("RoomMeetingDetailDialog", () => {
  beforeEach(() => {
    jest.mocked(getMeetingSummaryAction).mockResolvedValue({ kind: "ok", summary: SUMMARY });
  });

  // ⚠️ 개설자(host)가 시작 전(SCHEDULED) 회의를 열면 [수정]뿐 아니라 [회의 취소]도 나와야 한다
  //    (회의실 개설 모달과 같은 수정/삭제 흐름, 2026-08-15).
  it("개설자가 열면 [회의 취소]를 눌러 회의를 취소할 수 있고, 성공하면 onCancelled가 불린다", async () => {
    jest.mocked(cancelMeetingAction).mockResolvedValue({ error: null });
    const onCancelled = jest.fn();
    const onOpenChange = jest.fn();
    const user = userEvent.setup();

    render(
      <RoomMeetingDetailDialog
        meetingId="meeting-1"
        onOpenChange={onOpenChange}
        onTitleUpdated={jest.fn()}
        onCancelled={onCancelled}
      />,
    );

    const cancelButton = await screen.findByRole("button", { name: "회의 취소" });
    await user.click(cancelButton);

    const confirmDialog = await screen.findByRole("dialog", { name: "이 회의를 취소할까요?" });
    await user.click(within(confirmDialog).getByRole("button", { name: "회의 취소" }));

    await waitFor(() => expect(onCancelled).toHaveBeenCalledWith("meeting-1"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("개설자가 아니면 [회의 취소] 버튼이 없다", async () => {
    jest.mocked(getMeetingSummaryAction).mockResolvedValue({
      kind: "ok",
      summary: { ...SUMMARY, isHost: false },
    });

    render(
      <RoomMeetingDetailDialog
        meetingId="meeting-1"
        onOpenChange={jest.fn()}
        onTitleUpdated={jest.fn()}
        onCancelled={jest.fn()}
      />,
    );

    await screen.findByText(SUMMARY.title);
    expect(screen.queryByRole("button", { name: "회의 취소" })).not.toBeInTheDocument();
  });
});
