jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// react-big-calendar 자체는 무겁고 DOM 레이아웃(getBoundingClientRect 등)에 기대는 부분이 많다 —
// 여기서는 `Calendar`가 받는 `events`·`components.toolbar`만 확인하면 되므로 그 자리만 대역한다.
jest.mock("react-big-calendar", () => {
  const actual = jest.requireActual("react-big-calendar");
  return {
    ...actual,
    Calendar: (props: {
      date: Date;
      views: string[];
      events: { id: string }[];
      components?: { toolbar?: (toolbarProps: unknown) => React.ReactNode };
    }) => (
      <div>
        {props.components?.toolbar?.({
          date: props.date,
          onNavigate: () => {},
          label: "",
          view: "work_week",
          views: props.views,
          onView: () => {},
        })}
        <ul data-testid="visible-events">
          {props.events.map((event) => (
            <li key={event.id}>{event.id}</li>
          ))}
        </ul>
      </div>
    ),
  };
});

// 실제 툴바(회의실 select)는 base-ui 팝업 조작이 얽혀 있어 테스트 대상(필터링 로직)과
// 무관하다 — `onSelectedRoomChange`를 그대로 노출하는 버튼 스텁으로 바꿔 그 로직만 검증한다.
jest.mock("./rooms-calendar-toolbar", () => ({
  ALL_ROOMS_VALUE: "all",
  RoomsCalendarToolbar: ({
    rooms,
    onSelectedRoomChange,
  }: {
    rooms: { id: string; name: string }[];
    onSelectedRoomChange: (roomId: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onSelectedRoomChange("all")}>
        전체 회의실
      </button>
      {rooms.map((room) => (
        <button key={room.id} type="button" onClick={() => onSelectedRoomChange(room.id)}>
          {room.name}
        </button>
      ))}
    </div>
  ),
}));

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AUTHORITY } from "@/constants/authority";

import type { MeetingRoom, RoomMember, RoomReservation } from "../types";
import { WeeklyRoomCalendar } from "./weekly-room-calendar";

const ROOMS: MeetingRoom[] = [
  { id: "room-a", name: "대회의실", location: "3층 A동", openTime: "09:00", closeTime: "18:00" },
  { id: "room-b", name: "소회의실", location: "3층 B동", openTime: "09:00", closeTime: "18:00" },
];
const MEMBERS: RoomMember[] = [
  { id: 1, name: "박대표", teamName: null, authority: AUTHORITY.OWNER },
];

const RESERVATIONS: RoomReservation[] = [
  {
    id: "res-a",
    title: "A 회의",
    start: new Date("2026-08-10T10:00:00"),
    end: new Date("2026-08-10T10:30:00"),
    roomId: "room-a",
    roomName: "대회의실",
    projectId: "1",
    projectTag: "GOODS",
    topics: [{ main: "안건", sub: "" }],
    attendeeIds: [1],
    ownerId: 1,
  },
  {
    id: "res-b",
    title: "B 회의",
    start: new Date("2026-08-10T11:00:00"),
    end: new Date("2026-08-10T11:30:00"),
    roomId: "room-b",
    roomName: "소회의실",
    projectId: "1",
    projectTag: "GOODS",
    topics: [{ main: "안건", sub: "" }],
    attendeeIds: [1],
    ownerId: 1,
  },
];

function renderCalendar() {
  return render(
    <WeeklyRoomCalendar
      reservations={RESERVATIONS}
      members={MEMBERS}
      rooms={ROOMS}
      week="2026-08-10"
      onSelectSlot={jest.fn()}
      onAddClick={jest.fn()}
    />,
  );
}

describe("WeeklyRoomCalendar visibleReservations", () => {
  it("ALL_ROOMS_VALUE면 전체 예약을 Calendar에 넘긴다", () => {
    renderCalendar();

    const list = screen.getByTestId("visible-events");
    expect(within(list).getByText("res-a")).toBeInTheDocument();
    expect(within(list).getByText("res-b")).toBeInTheDocument();
  });

  it("특정 회의실을 고르면 그 회의실 예약만 Calendar에 넘긴다", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(screen.getByRole("button", { name: "대회의실" }));

    const list = screen.getByTestId("visible-events");
    expect(within(list).getByText("res-a")).toBeInTheDocument();
    expect(within(list).queryByText("res-b")).not.toBeInTheDocument();
  });

  it("전체 회의실로 되돌리면 다시 전체 예약을 보여준다", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(screen.getByRole("button", { name: "소회의실" }));
    await user.click(screen.getByRole("button", { name: "전체 회의실" }));

    const list = screen.getByTestId("visible-events");
    expect(within(list).getByText("res-a")).toBeInTheDocument();
    expect(within(list).getByText("res-b")).toBeInTheDocument();
  });
});
