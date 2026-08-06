jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { MeetingRoom, RoomMember, RoomProjectOption } from "../types";
import { RoomReservationDialog } from "./room-reservation-dialog";

const ROOMS: MeetingRoom[] = [
  { id: "room-large", name: "대회의실", capacity: 8, openTime: "09:00", closeTime: "18:00" },
];
const MEMBERS: RoomMember[] = [{ id: 1, name: "박대표" }];
const PROJECTS: RoomProjectOption[] = [{ id: "p-goods", name: "굿즈 프로젝트", tag: "GOODS" }];

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
    expect(screen.getByText("대주제를 선택해 주세요")).toBeInTheDocument();
    expect(screen.getByText("참석자를 한 명 이상 선택해 주세요")).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });
});
