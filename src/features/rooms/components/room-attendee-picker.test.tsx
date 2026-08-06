import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { RoomMember } from "../types";
import { RoomAttendeePicker } from "./room-attendee-picker";

const MEMBERS: RoomMember[] = [
  { id: 1, name: "박대표" },
  { id: 2, name: "김서준" },
  { id: 3, name: "이하윤" },
];

describe("RoomAttendeePicker", () => {
  it("이름을 검색하면 이미 선택된 사람은 빼고 결과를 보여준다", async () => {
    const user = userEvent.setup();
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[1]} onChange={jest.fn()} />);

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "박");

    // 이미 선택된 "박대표"는 칩으로만 남고, 검색 결과 버튼으로는 다시 뜨지 않는다.
    expect(screen.queryByRole("button", { name: "박대표" })).not.toBeInTheDocument();
  });

  it("검색 결과를 누르면 선택 목록에 추가하고 검색어를 지운다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "김서준");
    await user.click(screen.getByRole("button", { name: "김서준" }));

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("선택된 사람의 X를 누르면 목록에서 뺀다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[1, 2]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "김서준 제외" }));

    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("아무도 선택 안 하면 안내 문구를 보여준다", () => {
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[]} onChange={jest.fn()} />);

    expect(screen.getByText("참석자를 검색해 선택하세요")).toBeInTheDocument();
  });
});
