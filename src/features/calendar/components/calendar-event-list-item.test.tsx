import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CALENDAR_ITEM_TAG, type PersonalCalendarEvent } from "../types";
import { CalendarEventListItem } from "./calendar-event-list-item";

function buildEvent(overrides: Partial<PersonalCalendarEvent> = {}): PersonalCalendarEvent {
  return {
    id: "todo-1",
    title: "주간 보고서 작성",
    start: new Date("2026-08-05T00:00:00"),
    end: new Date("2026-08-05T00:00:00"),
    tag: CALENDAR_ITEM_TAG.PERSONAL_TODO,
    isCompleted: false,
    ...overrides,
  };
}

describe("CalendarEventListItem", () => {
  it("개인 Todo는 체크박스를 보여주고 클릭하면 토글 콜백에 id를 실어 보낸다", async () => {
    const user = userEvent.setup();
    const onToggleCompletion = jest.fn();
    render(<CalendarEventListItem event={buildEvent()} onToggleCompletion={onToggleCompletion} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onToggleCompletion).toHaveBeenCalledWith("todo-1");
  });

  it("완료된 Todo는 제목에 취소선이 붙는다", () => {
    render(<CalendarEventListItem event={buildEvent({ isCompleted: true })} />);

    expect(screen.getByText("주간 보고서 작성")).toHaveClass("line-through");
  });

  // ⚠️ 개인 액션은 완료 처리 화면이 따로 있다 — 여기서 체크박스로 건드릴 수 있으면 안 된다.
  it("개인 액션은 체크박스가 없다", () => {
    render(
      <CalendarEventListItem
        event={buildEvent({
          id: "action-1",
          tag: CALENDAR_ITEM_TAG.PERSONAL_ACTION,
          title: "회의실 예약 정책 공유",
        })}
      />,
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("개인 액션")).toBeInTheDocument();
  });
});
