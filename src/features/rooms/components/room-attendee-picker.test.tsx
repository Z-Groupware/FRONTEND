import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AUTHORITY } from "@/constants/authority";

import type { RoomMember } from "../types";
import { RoomAttendeePicker } from "./room-attendee-picker";

const MEMBERS: RoomMember[] = [
  { id: 1, name: "박대표", teamName: null, authority: AUTHORITY.OWNER },
  { id: 2, name: "김서준", teamName: "개발팀", authority: AUTHORITY.LEADER },
  { id: 3, name: "이하윤", teamName: "개발팀", authority: AUTHORITY.MEMBER },
];

describe("RoomAttendeePicker", () => {
  it("검색 전에는 전체 목록을 보여준다", () => {
    render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[]}
        onChange={jest.fn()}
        viewerTeamName="개발팀"
      />,
    );

    expect(screen.getByText("박대표")).toBeInTheDocument();
    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.getByText("이하윤")).toBeInTheDocument();
  });

  it("이름을 검색하면 그 이름만 남는다", async () => {
    const user = userEvent.setup();
    render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[]}
        onChange={jest.fn()}
        viewerTeamName="개발팀"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "김");

    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.queryByText("박대표")).not.toBeInTheDocument();
  });

  it("체크하면 onChange에 추가된 id를 실어 보낸다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[]}
        onChange={onChange}
        viewerTeamName="개발팀"
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "김서준" }));

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("이미 선택된 사람의 체크를 풀면 목록에서 뺀다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[1, 2]}
        onChange={onChange}
        viewerTeamName="개발팀"
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "김서준" }));

    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("선택 인원 수를 보여준다", () => {
    render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[1, 2]}
        onChange={jest.fn()}
        viewerTeamName="개발팀"
      />,
    );

    expect(screen.getByText("선택 2명")).toBeInTheDocument();
  });

  it("검색 결과가 없으면 안내 문구를 보여준다", async () => {
    const user = userEvent.setup();
    render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[]}
        onChange={jest.fn()}
        viewerTeamName="개발팀"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "존재하지않는이름");

    expect(screen.getByText("검색 결과가 없어요")).toBeInTheDocument();
  });

  it("'팀장급만'을 고르면 LEADER만 남는다", async () => {
    const user = userEvent.setup();
    render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[]}
        onChange={jest.fn()}
        viewerTeamName="개발팀"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "팀장급만" }));

    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.queryByText("박대표")).not.toBeInTheDocument();
    expect(screen.queryByText("이하윤")).not.toBeInTheDocument();
  });

  it("'내 부서만'을 고르면 같은 부서만 남는다", async () => {
    const user = userEvent.setup();
    render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[]}
        onChange={jest.fn()}
        viewerTeamName="개발팀"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "내 부서만" }));

    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.getByText("이하윤")).toBeInTheDocument();
    expect(screen.queryByText("박대표")).not.toBeInTheDocument();
  });
});
