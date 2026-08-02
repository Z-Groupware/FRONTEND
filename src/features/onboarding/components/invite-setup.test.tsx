import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ROLE } from "@/constants/domain";

import type { DepartmentNode, Position } from "../types";
import { InviteSetup } from "./invite-setup";

/**
 * 사원 초대 — 잘못된 주소를 걸러 내는 것이 이 화면의 일이다.
 *
 * ⚠️ 입력 중에는 잔소리하지 않는다. **뭔가 적혔는데 형식이 어긋날 때만** 알린다 —
 *    한 글자 칠 때마다 빨간 글씨가 뜨면 아무도 안 읽는다.
 */
const DEPARTMENTS: DepartmentNode[] = [
  { id: "d1", name: "개발팀", children: [{ id: "r1", name: "프론트엔드", children: [] }] },
];
const POSITIONS: Position[] = [{ id: "p1", name: "사원", role: ROLE.MEMBER }];

function setup() {
  return {
    user: userEvent.setup(),
    ...render(<InviteSetup departments={DEPARTMENTS} positions={POSITIONS} />),
  };
}

beforeEach(() => window.sessionStorage.clear());

describe("InviteSetup", () => {
  it("형식이 어긋난 주소는 그 자리에서 알려준다", async () => {
    const { user } = setup();

    await user.type(screen.getAllByLabelText("초대할 메일 주소")[0]!, "hyun");

    expect(screen.getByText("메일 주소 형식이 아니에요")).toBeInTheDocument();
  });

  it("제대로 된 주소에는 아무 말도 하지 않는다", async () => {
    const { user } = setup();

    await user.type(screen.getAllByLabelText("초대할 메일 주소")[0]!, "hyun@nova.com");

    expect(screen.queryByText("메일 주소 형식이 아니에요")).not.toBeInTheDocument();
  });

  // 같은 사람을 두 번 초대하면 계정이 두 개 생긴다
  it("같은 주소를 또 적으면 잡아낸다", async () => {
    const { user } = setup();

    await user.type(screen.getAllByLabelText("초대할 메일 주소")[0]!, "hyun@nova.com");
    await user.click(screen.getByRole("button", { name: "행 추가" }));

    const rows = screen.getAllByLabelText("초대할 메일 주소");
    await user.type(rows[rows.length - 1]!, "hyun@nova.com");

    // ⚠️ 지금은 **겹치는 줄 전부**에 표시된다. 첫 줄에도 "위에 또 있어요"가 뜨는 건
    //    문구와 맞지 않는데, 고칠지는 팀 확인이 필요해 현재 동작을 그대로 고정해 둔다.
    expect(screen.getAllByText("같은 주소가 위에 또 있어요")).toHaveLength(2);
  });
});
