import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { ChangePasswordState } from "../actions";
import { ChangePasswordDialog } from "./change-password-dialog";

/**
 * 재열림 시 지난 시도의 필드 오류가 남지 않아야 한다(#668 리뷰).
 *
 * ⚠️ `fixed`를 빈 Set으로만 초기화하면 `errorOf`가 `state.errors`를 그대로 돌려줘,
 *    닫았다 다시 열었을 때 아직 아무것도 안 쳤는데 지난 오류가 보인다.
 */
const changePasswordAction = jest.fn<
  Promise<ChangePasswordState>,
  [ChangePasswordState, FormData]
>();
jest.mock("../actions", () => ({
  changePasswordAction: (...args: [ChangePasswordState, FormData]) => changePasswordAction(...args),
}));

function setup() {
  const onOpenChange = jest.fn();
  const user = userEvent.setup();
  const view = render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);
  return { user, onOpenChange, ...view };
}

beforeEach(() => {
  changePasswordAction.mockReset();
});

describe("ChangePasswordDialog", () => {
  it("실패 뒤 닫고 다시 열면 필드 오류가 남아 있지 않다", async () => {
    changePasswordAction.mockResolvedValue({
      errors: { currentPassword: "현재 비밀번호가 올바르지 않습니다" },
      attempt: 1,
    });

    const { user, onOpenChange, rerender } = setup();

    await user.type(screen.getByLabelText("현재 비밀번호"), "wrong-password");
    await user.type(screen.getByLabelText("새 비밀번호"), "NewPass123!");
    await user.type(screen.getByLabelText("새 비밀번호 확인"), "NewPass123!");
    await user.click(screen.getByRole("button", { name: "변경" }));

    await waitFor(() =>
      expect(screen.getByText("현재 비밀번호가 올바르지 않습니다")).toBeInTheDocument(),
    );

    // 닫기(취소 경로 = handleClose)
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // 부모가 open=false로 반영한 뒤 다시 open=true로 되돌린다(메뉴로 재오픈하는 흐름)
    rerender(<ChangePasswordDialog open={false} onOpenChange={onOpenChange} />);
    rerender(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

    expect(screen.queryByText("현재 비밀번호가 올바르지 않습니다")).not.toBeInTheDocument();
  });
});
