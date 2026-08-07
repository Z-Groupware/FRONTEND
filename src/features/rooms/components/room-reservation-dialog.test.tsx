jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/mock-actor", () => ({
  getMockActor: jest.fn(() => ({ id: 1, role: "OWNER" })),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AUTHORITY } from "@/constants/authority";

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
const MEMBERS: RoomMember[] = [{ id: 1, name: "박대표" }];
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
      hostAuthority={AUTHORITY.OWNER}
      teamActions={TEAM_ACTIONS}
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
        hostAuthority={AUTHORITY.OWNER}
        teamActions={TEAM_ACTIONS}
        onCreated={jest.fn()}
      />,
    );

    expect(screen.queryByText("회의실을 예약할까요?")).not.toBeInTheDocument();
  });

  it("클릭한 슬롯의 날짜·시각을 안내한다", () => {
    renderDialog();

    expect(screen.getByText(/8월 11일\(화\) 10:00부터 30분간 진행됩니다\./)).toBeInTheDocument();
  });

  it("취소를 누르면 onOpenChange(false)를 부른다", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Owner가 열면 상위 팀 액션 필드가 없다", () => {
    renderDialog({ hostAuthority: AUTHORITY.OWNER });

    expect(screen.queryByText("상위 팀 액션")).not.toBeInTheDocument();
  });

  it("Leader가 열면 상위 팀 액션 필드가 뜬다", () => {
    renderDialog({ hostAuthority: AUTHORITY.LEADER });

    expect(screen.getByText("상위 팀 액션")).toBeInTheDocument();
  });

  it("필수값을 안 채우고 등록을 누르면 필드별 오류를 보여주고 onCreated는 안 부른다", async () => {
    const user = userEvent.setup();
    const { onCreated } = renderDialog();

    await user.type(screen.getByLabelText("회의 제목"), "새 회의");
    await user.click(screen.getByRole("button", { name: "등록" }));

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
