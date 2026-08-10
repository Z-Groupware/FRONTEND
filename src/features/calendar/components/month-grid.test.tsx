import { render, screen } from "@testing-library/react";

import { CALENDAR_ITEM_TAG, type PersonalCalendarEvent } from "../types";
import { MonthGrid } from "./month-grid";

function buildEvent(overrides: Partial<PersonalCalendarEvent> = {}): PersonalCalendarEvent {
  return {
    id: "todo-1",
    title: "여러 날 Todo",
    start: new Date("2026-08-05T00:00:00"),
    end: new Date("2026-08-05T00:00:00"),
    tag: CALENDAR_ITEM_TAG.PERSONAL_TODO,
    isCompleted: false,
    ...overrides,
  };
}

describe("MonthGrid — 여러 날에 걸친 Todo", () => {
  it("시작~끝 날짜에 걸친 모든 칸에 걸린다", () => {
    const event = buildEvent({ end: new Date("2026-08-07T00:00:00") });
    render(
      <MonthGrid
        events={[event]}
        month={new Date("2026-08-01T00:00:00")}
        selectedDate={new Date("2026-08-01T00:00:00")}
        onSelectDate={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /8월 5일.*일정 1건/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /8월 6일.*일정 1건/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /8월 7일.*일정 1건/ })).toBeInTheDocument();
    // 8월 4일·8월 8일은 구간 밖이라 걸리지 않는다.
    expect(screen.getByRole("button", { name: /8월 4일(?!.*일정)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /8월 8일(?!.*일정)/ })).toBeInTheDocument();
  });

  it("이어진 막대에서는 제목·상태 콩이 시작 칸에서만 보인다 — 같은 항목이 반복되지 않는다", () => {
    const event = buildEvent({ end: new Date("2026-08-07T00:00:00") });
    render(
      <MonthGrid
        events={[event]}
        month={new Date("2026-08-01T00:00:00")}
        selectedDate={new Date("2026-08-01T00:00:00")}
        onSelectDate={jest.fn()}
      />,
    );

    expect(screen.getAllByText("여러 날 Todo")).toHaveLength(1);
  });

  it("하루짜리 Todo는 그 날 칸에만 걸린다(기존 동작)", () => {
    const event = buildEvent();
    render(
      <MonthGrid
        events={[event]}
        month={new Date("2026-08-01T00:00:00")}
        selectedDate={new Date("2026-08-01T00:00:00")}
        onSelectDate={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /8월 5일.*일정 1건/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /8월 6일(?!.*일정)/ })).toBeInTheDocument();
    expect(screen.getAllByText("여러 날 Todo")).toHaveLength(1);
  });
});
