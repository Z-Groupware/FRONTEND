/**
 * 보드 페이지 empty state 회귀.
 *
 * ⚠️ 다른 5화면(내 액션·팀 액션·마이페이지·캘린더·프로젝트 타임라인)은 이미 EmptyState +
 *    명시 문구로 정직한 빈 상태를 그리는데, 보드만 예전에는 세 칸이 각기 "여기로 옮겨
 *    주세요."를 띄워 옮길 카드가 어딘가 있는 것처럼 읽혔다(§CLAUDE.md 정직성 위반).
 *    2026-08-16에 페이지 레벨 EmptyState로 통일. 여기서 못박아, 다시 세 칸이 텅 빈 채로
 *    뜨는 회귀가 오면 즉시 잡는다.
 */
jest.mock("../actions", () => ({
  commitBoardChangesAction: jest.fn(),
}));
jest.mock("./board-leave-guard", () => ({
  /* leave guard는 window 이벤트를 걸어 jsdom에서 시끄럽다 — 여기 테스트 관심사도 아니다 */
  BoardLeaveGuard: () => null,
}));

import { render, screen } from "@testing-library/react";

import type { BoardCard } from "../types";
import { BoardView } from "./board-view";

const TODAY = "2026-08-16";

function card(overrides: Partial<BoardCard> = {}): BoardCard {
  return {
    id: 1,
    title: "설계 검토",
    tagLabel: "GOODS",
    tagBgColor: "var(--tag-sky-bg)",
    tagTextColor: "var(--tag-sky-fg)",
    startDate: "2026-08-10",
    dueDate: "2026-08-20",
    isDone: false,
    ...overrides,
  };
}

describe("BoardView — 페이지 레벨 empty state", () => {
  it("cards가 0건이면 EmptyState 안내가 뜨고 세 칸·저장 버튼은 안 뜬다", () => {
    render(<BoardView boardType="my-action" cards={[]} todayIso={TODAY} />);

    expect(screen.getByText("아직 하달된 액션이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("액션이 하달되면 이 자리에 카드로 쌓입니다.")).toBeInTheDocument();
    expect(screen.queryByText(/드래그해서 칸을 옮길 수 있습니다/)).not.toBeInTheDocument();

    /*
      ⚠️ 세 칸·저장 버튼이 나타나면 회귀다 — 예전 렌더가 되돌아온 것이다. 칸 라벨(할 일·
         진행중·완료)과 저장 버튼("저장하기")이 안 뜨는지 함께 확인한다.
    */
    expect(screen.queryByRole("button", { name: /저장하기/ })).not.toBeInTheDocument();
    expect(screen.queryByText("할 일")).not.toBeInTheDocument();
    expect(screen.queryByText("진행중")).not.toBeInTheDocument();
    expect(screen.queryByText("완료")).not.toBeInTheDocument();
    expect(screen.queryByText("여기로 옮겨 주세요.")).not.toBeInTheDocument();
  });

  it("cards가 하나라도 있으면 empty 문구는 안 뜨고 세 칸·저장 버튼이 그대로 온다", () => {
    render(<BoardView boardType="my-action" cards={[card()]} todayIso={TODAY} />);

    expect(screen.queryByText("아직 하달된 액션이 없습니다.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /저장하기/ })).toBeInTheDocument();
    expect(screen.getByText("할 일")).toBeInTheDocument();
    expect(screen.getByText("진행중")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
  });
});
