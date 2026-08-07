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
  it("검색 전에는 전체 목록을 보여준다", () => {
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[]} onChange={jest.fn()} />);

    expect(screen.getByText("박대표")).toBeInTheDocument();
    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.getByText("이하윤")).toBeInTheDocument();
  });

  it("이름을 검색하면 그 이름만 남는다", async () => {
    const user = userEvent.setup();
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[]} onChange={jest.fn()} />);

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "김");

    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.queryByText("박대표")).not.toBeInTheDocument();
  });

  it("체크하면 onChange에 추가된 id를 실어 보낸다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[]} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox", { name: "김서준" }));

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("이미 선택된 사람의 체크를 풀면 목록에서 뺀다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[1, 2]} onChange={onChange} />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]!); // 김서준

    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("선택 인원 수를 보여준다", () => {
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[1, 2]} onChange={jest.fn()} />);

    expect(screen.getByText("선택 2명")).toBeInTheDocument();
  });

  it("검색 결과가 없으면 안내 문구를 보여준다", async () => {
    const user = userEvent.setup();
    render(<RoomAttendeePicker members={MEMBERS} selectedIds={[]} onChange={jest.fn()} />);

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "존재하지않는이름");

    expect(screen.getByText("검색 결과가 없어요")).toBeInTheDocument();
  });
});
