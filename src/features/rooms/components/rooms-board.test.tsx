import { AUTHORITY } from "@/constants/authority";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/mock-actor", () => ({
  getMockActor: jest.fn(() => ({ id: 1, role: AUTHORITY.OWNER })),
}));
// ⚠️ 실제 주간 캘린더는 `react-big-calendar` + `next/dynamic`을 물고 있어 무겁다 — 이 테스트는
//    "예약하기" 버튼이 모달을 여는지만 본다(그 캘린더 렌더링은 `weekly-room-calendar.test.tsx`가 맡는다).
jest.mock("./weekly-room-calendar-loader", () => ({
  WeeklyRoomCalendarLoader: () => null,
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { MeetingRoom, RoomProjectOption, RoomTeamActionOption } from "../types";
import { RoomsBoard } from "./rooms-board";

const ROOMS: MeetingRoom[] = [
  {
    id: "room-large",
    name: "대회의실",
    location: "3층 A동",
    openTime: "09:00",
    closeTime: "18:00",
  },
];
const MEMBERS = [{ id: 1, name: "박대표", teamName: null, authority: AUTHORITY.OWNER }];
const PROJECTS: RoomProjectOption[] = [{ id: "1", name: "굿즈 프로젝트", tag: "GOODS" }];
const TEAM_ACTIONS: RoomTeamActionOption[] = [];

describe("RoomsBoard", () => {
  it("우측 상단 [예약하기]를 누르면 예약 모달이 뜬다", async () => {
    const user = userEvent.setup();
    render(
      <RoomsBoard
        initialReservations={[]}
        rooms={ROOMS}
        members={MEMBERS}
        projects={PROJECTS}
        showParentTeamAction={false}
        teamActions={TEAM_ACTIONS}
        viewerTeamName={null}
        week="2026-08-10"
      />,
    );

    expect(screen.queryByText("회의실 예약")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "예약하기" }));

    expect(screen.getByText("회의실 예약")).toBeInTheDocument();
  });
});
