import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AUTHORITY } from "@/constants/authority";

import type { AttendeeScopeViewer } from "../attendee-scope";
import type { RoomMember } from "../types";
import { RoomAttendeePicker } from "./room-attendee-picker";

/*
  ⚠️ 이 파일은 2026-08-13에 통째로 다시 썼다 — 전에는 "전체 · 팀장급만"/"전체 · 내 부서만"
     **토글**을 검증했는데, 그 토글은 폐기됐다(범위가 개설자 권한으로 고정). 필터 라디오를
     기대하는 케이스를 되살리지 않는다(`attendee-scope.ts` 머리말).
*/
const MEMBERS: RoomMember[] = [
  { id: 1, name: "박대표", teamName: null, authority: AUTHORITY.OWNER },
  { id: 2, name: "김서준", teamName: "개발팀", authority: AUTHORITY.LEADER },
  { id: 3, name: "이하윤", teamName: "개발팀", authority: AUTHORITY.MEMBER },
  { id: 5, name: "최유진", teamName: "마케팅팀", authority: AUTHORITY.LEADER },
];

const OWNER_VIEWER: AttendeeScopeViewer = { id: 1, role: AUTHORITY.OWNER, teamName: null };
const LEADER_VIEWER: AttendeeScopeViewer = { id: 2, role: AUTHORITY.LEADER, teamName: "개발팀" };
const MEMBER_VIEWER: AttendeeScopeViewer = { id: 3, role: AUTHORITY.MEMBER, teamName: "개발팀" };

function renderPicker(
  viewer: AttendeeScopeViewer,
  overrides: Partial<React.ComponentProps<typeof RoomAttendeePicker>> = {},
) {
  const onChange = jest.fn();
  render(
    <RoomAttendeePicker
      members={MEMBERS}
      selectedIds={[]}
      onChange={onChange}
      viewer={viewer}
      {...overrides}
    />,
  );
  return { onChange };
}

describe("RoomAttendeePicker — 범위 강제(2026-08-13)", () => {
  it("필터 토글을 더 이상 그리지 않는다", () => {
    renderPicker(OWNER_VIEWER);

    expect(screen.queryByRole("radiogroup", { name: "참석자 필터" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText("전체")).not.toBeInTheDocument();
  });

  it("Owner가 열면 팀장만 보인다(Owner 본인·사원은 후보가 아니다)", () => {
    renderPicker(OWNER_VIEWER);

    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.getByText("최유진")).toBeInTheDocument();
    expect(screen.queryByText("박대표")).not.toBeInTheDocument();
    expect(screen.queryByText("이하윤")).not.toBeInTheDocument();
  });

  it("Leader가 열면 자기 팀만 보인다(다른 팀 팀장도, 본인도 안 보인다)", () => {
    renderPicker(LEADER_VIEWER);

    expect(screen.getByText("이하윤")).toBeInTheDocument();
    expect(screen.queryByText("김서준")).not.toBeInTheDocument();
    expect(screen.queryByText("최유진")).not.toBeInTheDocument();
    expect(screen.queryByText("박대표")).not.toBeInTheDocument();
  });

  it("Member가 열어도 Leader와 같은 범위(자기 팀)다", () => {
    renderPicker(MEMBER_VIEWER);

    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.queryByText("이하윤")).not.toBeInTheDocument();
    expect(screen.queryByText("최유진")).not.toBeInTheDocument();
  });

  it("host 본인은 체크박스로 안 내준다 — 풀어도 서버가 다시 넣는다(§정직성)", () => {
    renderPicker(LEADER_VIEWER, { selectedIds: [2, 3] });

    expect(screen.queryByRole("checkbox", { name: "김서준" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "이하윤" })).toBeChecked();
  });

  it("왜 목록이 짧은지 한 줄로 알린다(§정직성)", () => {
    const { unmount } = render(
      <RoomAttendeePicker
        members={MEMBERS}
        selectedIds={[]}
        onChange={jest.fn()}
        viewer={OWNER_VIEWER}
      />,
    );
    expect(screen.getByText("팀장만 지정할 수 있습니다")).toBeInTheDocument();
    unmount();

    renderPicker(LEADER_VIEWER);
    expect(screen.getByText("같은 팀 소속만 지정할 수 있습니다")).toBeInTheDocument();
  });

  it("소속 팀을 모르는 Leader·Member에게는 아무도 안 열린다(조용히 전원 허용 금지)", () => {
    renderPicker({ id: 3, role: AUTHORITY.MEMBER, teamName: null });

    expect(screen.getByText("지정할 수 있는 참석자가 없습니다")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("후보가 없는 것과 검색이 안 걸리는 것을 다른 문구로 가른다", async () => {
    const user = userEvent.setup();
    renderPicker(OWNER_VIEWER);

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "존재하지않는이름");

    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
  });

  it("검색은 범위 안에서만 걸린다 — 범위 밖 사람은 이름을 쳐도 안 나온다", async () => {
    const user = userEvent.setup();
    renderPicker(LEADER_VIEWER);

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "최유진");

    expect(screen.queryByText("최유진")).not.toBeInTheDocument();
    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
  });

  it("이름을 검색하면 그 이름만 남는다", async () => {
    const user = userEvent.setup();
    /* ⚠️ 개발팀 Member(이하윤) 시점이다 — Leader(김서준) 시점으로 "김"을 치면 host 본인이라
       애초에 후보가 아니라서, 검색이 되는지가 아니라 범위가 좁은지를 재게 된다. */
    renderPicker(MEMBER_VIEWER);

    await user.type(screen.getByRole("textbox", { name: "참석자 검색" }), "김");

    expect(screen.getByText("김서준")).toBeInTheDocument();
    expect(screen.queryByText("이하윤")).not.toBeInTheDocument();
  });

  it("체크하면 onChange에 추가된 id를 실어 보낸다", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker(OWNER_VIEWER);

    await user.click(screen.getByRole("checkbox", { name: "김서준" }));

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("이미 선택된 사람의 체크를 풀면 목록에서 뺀다", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker(OWNER_VIEWER, { selectedIds: [2, 5] });

    await user.click(screen.getByRole("checkbox", { name: "김서준" }));

    expect(onChange).toHaveBeenCalledWith([5]);
  });

  it("선택 인원 수를 보여준다", () => {
    renderPicker(OWNER_VIEWER, { selectedIds: [2, 5] });

    expect(screen.getByText("선택 2명")).toBeInTheDocument();
  });
});
