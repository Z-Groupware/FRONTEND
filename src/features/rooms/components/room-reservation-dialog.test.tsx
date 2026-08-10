import { AUTHORITY } from "@/constants/authority";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/mock-actor", () => ({
  getMockActor: jest.fn(() => ({ id: 1, role: AUTHORITY.OWNER })),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { MeetingRoom, RoomMember, RoomProjectOption, RoomTeamActionOption } from "../types";
import { RoomReservationDialog } from "./room-reservation-dialog";

const ROOMS: MeetingRoom[] = [
  {
    id: "room-large",
    name: "대회의실",
    location: "3층 A동",
    openTime: "09:00",
    closeTime: "18:00",
  },
];
const MEMBERS: RoomMember[] = [
  { id: 1, name: "박대표", teamName: null, authority: AUTHORITY.OWNER },
];
const PROJECTS: RoomProjectOption[] = [{ id: "1", name: "굿즈 프로젝트", tag: "GOODS" }];
const TEAM_ACTIONS: RoomTeamActionOption[] = [];

const SLOT_START = new Date("2026-08-11T10:00:00");

function renderDialog(overrides: Partial<React.ComponentProps<typeof RoomReservationDialog>> = {}) {
  const onOpenChange = jest.fn();
  const onCreated = jest.fn();
  render(
    <RoomReservationDialog
      slotStart={SLOT_START}
      onOpenChange={onOpenChange}
      rooms={ROOMS}
      members={MEMBERS}
      projects={PROJECTS}
      showParentTeamAction={false}
      teamActions={TEAM_ACTIONS}
      viewerTeamName={null}
      onCreated={onCreated}
      {...overrides}
    />,
  );
  return { onOpenChange, onCreated };
}

describe("RoomReservationDialog", () => {
  it("slotStart가 없으면 아무것도 그리지 않는다", () => {
    render(
      <RoomReservationDialog
        slotStart={null}
        onOpenChange={jest.fn()}
        rooms={ROOMS}
        members={MEMBERS}
        projects={PROJECTS}
        showParentTeamAction={false}
        teamActions={TEAM_ACTIONS}
        viewerTeamName={null}
        onCreated={jest.fn()}
      />,
    );

    expect(screen.queryByText("회의실 예약")).not.toBeInTheDocument();
  });

  it("클릭한 슬롯의 날짜·시각을 안내한다", () => {
    renderDialog();

    expect(screen.getByText("화 8/11")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 10:30")).toBeInTheDocument();
    expect(screen.getByText("30분 · 즉시 확정")).toBeInTheDocument();
  });

  it("취소를 누르면 onOpenChange(false)를 부른다", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("showParentTeamAction이 false면 상위 팀 액션 필드가 없다(Owner 개설)", () => {
    renderDialog({ showParentTeamAction: false });

    expect(screen.queryByRole("combobox", { name: "상위 팀 액션" })).not.toBeInTheDocument();
  });

  it("showParentTeamAction이 true면 상위 팀 액션 필드가 뜬다(Leader/Member 개설)", () => {
    renderDialog({ showParentTeamAction: true });

    expect(screen.getByRole("combobox", { name: "상위 팀 액션" })).toBeInTheDocument();
  });

  it("즉시 예약을 누르면 바로 등록하지 않고 확인 모달을 먼저 띄운다", async () => {
    const user = userEvent.setup();
    const { onCreated } = renderDialog();

    await user.click(screen.getByRole("button", { name: "즉시 예약" }));

    expect(screen.getByRole("dialog", { name: "이대로 등록하시겠습니까?" })).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("확인 모달에서 취소하면 등록하지 않는다", async () => {
    const user = userEvent.setup();
    const { onCreated } = renderDialog();

    await user.click(screen.getByRole("button", { name: "즉시 예약" }));
    // ⚠️ 본 다이얼로그의 [취소]와 이름이 같다 — 나중에(위에) 뜬 확인 모달 쪽을 고른다.
    const cancelButtons = screen.getAllByRole("button", { name: "취소" });
    await user.click(cancelButtons.at(-1)!);

    expect(
      screen.queryByRole("dialog", { name: "이대로 등록하시겠습니까?" }),
    ).not.toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("필수값을 안 채우고 확인 모달에서 예약을 누르면 필드별 오류를 보여주고 onCreated는 안 부른다", async () => {
    const user = userEvent.setup();
    const { onCreated } = renderDialog();

    await user.type(screen.getByLabelText("회의 제목"), "새 회의");
    await user.click(screen.getByRole("button", { name: "즉시 예약" }));
    await user.click(screen.getByRole("button", { name: "예약" }));

    await waitFor(() => {
      const roomError = screen.getByText(
        (_content, element) =>
          element?.tagName === "P" && element.textContent === "회의실을 선택해 주세요",
      );
      expect(roomError).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === "P" && element.textContent === "프로젝트를 선택해 주세요",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("회의 안건(대주제·소주제)을 한 쌍 이상 입력해 주세요"),
    ).toBeInTheDocument();
    expect(screen.getByText("참석자를 한 명 이상 선택해 주세요")).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });
});
