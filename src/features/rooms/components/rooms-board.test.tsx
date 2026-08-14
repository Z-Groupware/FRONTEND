import { AUTHORITY } from "@/constants/authority";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/mock-actor", () => ({
  getMockActor: jest.fn(() => ({ id: 1, role: AUTHORITY.OWNER })),
}));
// ⚠️ 실제 주간 캘린더는 `react-big-calendar` + `next/dynamic`을 물고 있어 무겁다 — 이 테스트는
//    "회의 추가"(2026-08-10 이전엔 "예약하기") 콜백이 모달을 여는지만 본다(그 캘린더 렌더링은
//    `weekly-room-calendar.test.tsx`가 맡는다). 버튼 자체는 `RoomListPanel` 안에 있어서, 그
//    자리를 대신할 최소 스텁으로 `onAddClick`을 그대로 노출한다.
jest.mock("./weekly-room-calendar-loader", () => ({
  WeeklyRoomCalendarLoader: () => null,
}));
jest.mock("./room-list-panel", () => ({
  RoomListPanel: ({ onAddClick }: { onAddClick: () => void }) => (
    <button type="button" onClick={onAddClick}>
      회의 추가
    </button>
  ),
}));

import { fireEvent, render, screen } from "@testing-library/react";
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
const MEMBERS = [{ id: 2, name: "김서준", teamName: "개발팀", authority: AUTHORITY.LEADER }];
const PROJECTS: RoomProjectOption[] = [{ id: "1", name: "굿즈 프로젝트", tag: "GOODS" }];
const TEAM_ACTIONS: RoomTeamActionOption[] = [];

describe("RoomsBoard", () => {
  it("[회의 추가]를 누르면 예약 모달이 뜬다", async () => {
    const user = userEvent.setup();
    render(
      <RoomsBoard
        initialEvents={[]}
        rooms={ROOMS}
        selectedRoomId="room-large"
        members={MEMBERS}
        projects={PROJECTS}
        showParentTeamAction={false}
        teamActions={TEAM_ACTIONS}
        viewer={{ id: 1, role: AUTHORITY.OWNER, teamName: null }}
        week="2026-08-10"
      />,
    );

    expect(screen.queryByRole("dialog", { name: "회의실 예약" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "회의 추가" }));

    expect(screen.getByRole("heading", { name: "회의실 예약" })).toBeInTheDocument();
  });

  it("다른 주를 보는 중에 [회의 추가]를 누르면 지금 보고 있는 주 안의 요일이 잡힌다", () => {
    // ⚠️ 회귀 테스트 — 예전엔 `getNextAvailableSlot(new Date())`를 그대로 써서, "지금"이
    //    표시 중인 주(`week`)와 다른 주면 그 실제 오늘 날짜가 `SlotPicker`의 요일 선택지
    //    (표시 중인 주의 월~금)에 없어 `form.date`가 선택지 밖 값이 됐다.
    jest.useFakeTimers();
    // 2026-08-20(목)은 월요일이 2026-08-17인 주다 — 아래 `week="2026-08-10"`과 다른 주.
    jest.setSystemTime(new Date("2026-08-20T15:00:00"));

    render(
      <RoomsBoard
        initialEvents={[]}
        rooms={ROOMS}
        selectedRoomId="room-large"
        members={MEMBERS}
        projects={PROJECTS}
        showParentTeamAction={false}
        teamActions={TEAM_ACTIONS}
        viewer={{ id: 1, role: AUTHORITY.OWNER, teamName: null }}
        week="2026-08-10"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "회의 추가" }));

    expect(screen.getByRole("combobox", { name: "예약 요일" })).toHaveTextContent("월 8/10");
    expect(screen.getByRole("combobox", { name: "예약 시작 시간" })).toHaveTextContent("09:00");

    jest.useRealTimers();
  });
});
