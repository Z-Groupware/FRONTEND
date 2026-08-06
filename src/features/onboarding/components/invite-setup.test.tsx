import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AUTHORITY } from "@/constants/domain";

import type { DepartmentNode, Position } from "../types";
import { InviteSetup } from "./invite-setup";

/**
 * 사원 초대 — 잘못된 주소를 걸러 내는 것이 이 화면의 일이다.
 *
 * ⚠️ 입력 중에는 잔소리하지 않는다. **뭔가 적혔는데 형식이 어긋날 때만** 알린다 —
 *    한 글자 칠 때마다 빨간 글씨가 뜨면 아무도 안 읽는다.
 */
/*
  이 화면은 **이미 발송된 목록이면 결제로 돌려보낸다** — 그래서 라우터를 쓴다.
  테스트는 발송 전 상태만 다루므로 돌려보내는 일이 없다. 목은 라우터가 없다는 오류만 막는다.
*/
const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: (...args: string[]) => replace(...args) }),
}));

const DEPARTMENTS: DepartmentNode[] = [
  { id: "d1", name: "개발팀", children: [{ id: "r1", name: "프론트엔드", children: [] }] },
];
const POSITIONS: Position[] = [{ id: "p1", name: "사원", role: AUTHORITY.MEMBER }];

function setup() {
  return {
    user: userEvent.setup(),
    ...render(<InviteSetup departments={DEPARTMENTS} positions={POSITIONS} />),
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  replace.mockClear();
});

describe("InviteSetup", () => {
  it("형식이 어긋난 주소는 그 자리에서 알려준다", async () => {
    const { user } = setup();

    await user.type(screen.getAllByLabelText("초대할 메일 주소")[0]!, "hyun");

    expect(screen.getByText("주소 형식이 아닙니다")).toBeInTheDocument();
  });

  it("제대로 된 주소에는 아무 말도 하지 않는다", async () => {
    const { user } = setup();

    await user.type(screen.getAllByLabelText("초대할 메일 주소")[0]!, "hyun@nova.com");

    expect(screen.queryByText("주소 형식이 아닙니다")).not.toBeInTheDocument();
  });

  // 같은 사람을 두 번 초대하면 계정이 두 개 생긴다
  it("같은 주소를 또 적으면 잡아낸다", async () => {
    const { user } = setup();

    await user.type(screen.getAllByLabelText("초대할 메일 주소")[0]!, "hyun@nova.com");
    await user.click(screen.getByRole("button", { name: "행 추가" }));

    const rows = screen.getAllByLabelText("초대할 메일 주소");
    await user.type(rows[rows.length - 1]!, "hyun@nova.com");

    // ⚠️ 지금은 **겹치는 줄 전부**에 표시된다. 첫 줄에도 문구가 뜨는 건
    //    문구와 맞지 않는데, 고칠지는 팀 확인이 필요해 현재 동작을 그대로 고정해 둔다.
    expect(screen.getAllByText("위에 같은 주소가 있습니다")).toHaveLength(2);
  });
});
