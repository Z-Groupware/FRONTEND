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

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

/*
  ⚠️ 회귀 방지(#609) — DnD 보드가 `PointerSensor`만 걸려 있어 키보드·스크린리더로는 카드를
     옮길 방법이 없었다(CLAUDE.md §a11y "DnD 보드는 키보드 대체 경로 필수" 위반). 카드마다
     [옮기기] 버튼을 대체 경로로 붙였다 — 드래그와 같은 `canMoveCard` 규칙을 타므로, 버튼도
     드래그와 똑같이 저장 전 미리보기(override)로만 반영되고 [저장하기]를 눌러야 확정된다.
*/
/** 카드는 옮겨지면 다른 칸(다른 부모)으로 리마운트된다 — 매번 다시 찾아야 한다. */
function findCard(title: string): HTMLElement {
  return screen.getByText(title).closest('[class*="rounded-[20px]"]') as HTMLElement;
}

describe("BoardCard — 키보드 대체 경로 [옮기기] 버튼(#609)", () => {
  it("할 일 카드는 [진행중으로 옮기기] 버튼만 있고, 누르면 진행중으로 옮겨져 저장 대기가 잡힌다", async () => {
    const user = userEvent.setup();
    const todoCard = card({ title: "예정 작업", startDate: "2026-08-20" });
    render(<BoardView boardType="my-action" cards={[todoCard]} todayIso={TODAY} />);

    expect(
      within(findCard("예정 작업")).getByRole("button", { name: "진행중으로 옮기기" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장하기" })).toBeDisabled();

    await user.click(
      within(findCard("예정 작업")).getByRole("button", { name: "진행중으로 옮기기" }),
    );

    expect(screen.getByRole("button", { name: "저장하기 (1)" })).toBeInTheDocument();
    expect(
      within(findCard("예정 작업")).getByRole("button", { name: "할 일로 옮기기" }),
    ).toBeInTheDocument();
  });

  it("버튼으로 옮긴 뒤 되돌리기 버튼을 누르면 override가 지워지고 저장 대기가 풀린다", async () => {
    const user = userEvent.setup();
    const todoCard = card({ title: "예정 작업", startDate: "2026-08-20" });
    render(<BoardView boardType="my-action" cards={[todoCard]} todayIso={TODAY} />);

    await user.click(
      within(findCard("예정 작업")).getByRole("button", { name: "진행중으로 옮기기" }),
    );
    await user.click(within(findCard("예정 작업")).getByRole("button", { name: "할 일로 옮기기" }));

    expect(screen.getByRole("button", { name: "저장하기" })).toBeDisabled();
    expect(
      within(findCard("예정 작업")).getByRole("button", { name: "진행중으로 옮기기" }),
    ).toBeInTheDocument();
  });

  it("완료 카드는 [진행중으로 옮기기] 버튼만 있다 — 할 일로는 못 간다", () => {
    const doneCard = card({ title: "끝난 작업", isDone: true });
    render(<BoardView boardType="my-action" cards={[doneCard]} todayIso={TODAY} />);

    const cardEl = findCard("끝난 작업");
    expect(within(cardEl).getByRole("button", { name: "진행중으로 옮기기" })).toBeInTheDocument();
    expect(
      within(cardEl).queryByRole("button", { name: "할 일로 옮기기" }),
    ).not.toBeInTheDocument();
  });
});
