import { render, screen } from "@testing-library/react";

import { InviteCommitDialog } from "./invite-commit-dialog";

/**
 * 제출 중 진행 문구 — description(제출 전 요약)과 같은 말을 해야 한다.
 *
 * ⚠️ `sendableCount === 0`(발송 대상이 없음)이면 메일을 안 보내는데, 진행 문구가
 *    "메일 발송에 최대 1분"이라고 하면 안 하는 일을 한다고 안내하는 셈이다(#668 리뷰).
 */
function renderDialog(props: Partial<Parameters<typeof InviteCommitDialog>[0]> = {}) {
  return render(
    <InviteCommitDialog
      isOpen
      onOpenChange={jest.fn()}
      departmentCount={1}
      positionCount={1}
      writtenCount={0}
      sendableCount={0}
      unfilledCount={0}
      flaggedCount={0}
      onConfirm={jest.fn()}
      isPending
      {...props}
    />,
  );
}

describe("InviteCommitDialog", () => {
  it("sendableCount가 0이면 메일 발송을 언급하지 않는다", () => {
    renderDialog({ sendableCount: 0 });

    expect(screen.getByText("계정 발급에 최대 1분 정도 걸립니다.")).toBeInTheDocument();
    expect(screen.queryByText(/메일 발송/)).not.toBeInTheDocument();
  });

  it("sendableCount가 0보다 크면 계정 발급·메일 발송을 함께 안내한다", () => {
    renderDialog({ sendableCount: 3 });

    expect(
      screen.getByText("계정 발급과 초대 메일 발송에 최대 1분 정도 걸립니다."),
    ).toBeInTheDocument();
  });
});
