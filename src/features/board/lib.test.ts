import { canMoveCard, getBoardColumn, groupCardsByColumn, isCardDelayed } from "./lib";
import type { BoardCard } from "./types";

const TODAY = new Date("2026-08-06T09:00:00");

function card(overrides: Partial<BoardCard>): BoardCard {
  return {
    id: 1,
    title: "카드",
    tagLabel: "TAG",
    tagBgColor: "#fff",
    tagTextColor: "#000",
    startDate: "2026-08-01",
    dueDate: "2026-08-10",
    isDone: false,
    ...overrides,
  };
}

describe("getBoardColumn", () => {
  it("완료면 시작일과 무관하게 완료다", () => {
    expect(getBoardColumn(card({ isDone: true, startDate: "2026-08-01" }), TODAY)).toBe("DONE");
  });

  it("시작일이 오늘보다 뒤면 할 일이다", () => {
    expect(getBoardColumn(card({ startDate: "2026-08-07" }), TODAY)).toBe("TODO");
  });

  it("시작일이 오늘이거나 지났으면 진행중이다(마감이 지났어도)", () => {
    expect(getBoardColumn(card({ startDate: "2026-08-06" }), TODAY)).toBe("IN_PROGRESS");
    expect(getBoardColumn(card({ startDate: "2026-07-01", dueDate: "2026-07-15" }), TODAY)).toBe(
      "IN_PROGRESS",
    );
  });
});

describe("isCardDelayed", () => {
  it("완료면 마감이 지났어도 지연이 아니다", () => {
    expect(isCardDelayed(card({ isDone: true, dueDate: "2026-07-01" }), TODAY)).toBe(false);
  });

  it("완료가 아니고 마감이 지났으면 지연이다 — 칸 판정은 호출부(`board-view.tsx`) 몫이다", () => {
    /*
      ⚠️ 시작일이 미래(할 일 칸)이든 과거(진행중 칸)이든 `isCardDelayed`는 마감 경과만 본다.
         "진행중 칸 안의 배지"라는 확정 규칙은 호출부(`isDelayedInView`)가 `columnOf(card)`를
         함께 봐서 지운다 — `getBoardColumn`을 여기서 부르면 드래그 override를 놓친다.
    */
    expect(isCardDelayed(card({ dueDate: "2026-08-01" }), TODAY)).toBe(true);
    expect(isCardDelayed(card({ startDate: "2026-08-07", dueDate: "2026-08-01" }), TODAY)).toBe(
      true,
    );
    expect(isCardDelayed(card({ startDate: "2026-07-01", dueDate: "2026-08-01" }), TODAY)).toBe(
      true,
    );
  });

  it("마감이 안 지났으면 지연이 아니다", () => {
    expect(isCardDelayed(card({ dueDate: "2026-08-10" }), TODAY)).toBe(false);
  });

  it("오늘 마감은 지연이 아니다 — KST 자정 경계 회귀(공용 `isPastDue`)", () => {
    expect(isCardDelayed(card({ dueDate: "2026-08-06" }), TODAY)).toBe(false);
  });
});

describe("canMoveCard", () => {
  it("할 일→진행중, 진행중→완료, 완료→진행중만 허용한다", () => {
    expect(canMoveCard("TODO", "IN_PROGRESS")).toBe(true);
    expect(canMoveCard("IN_PROGRESS", "DONE")).toBe(true);
    expect(canMoveCard("DONE", "IN_PROGRESS")).toBe(true);
  });

  it("같은 칸으로의 이동은 항상 허용한다", () => {
    expect(canMoveCard("TODO", "TODO")).toBe(true);
  });

  it("할 일↔완료 직행, 진행중→할 일은 막는다", () => {
    expect(canMoveCard("TODO", "DONE")).toBe(false);
    expect(canMoveCard("DONE", "TODO")).toBe(false);
    expect(canMoveCard("IN_PROGRESS", "TODO")).toBe(false);
  });
});

describe("groupCardsByColumn", () => {
  it("카드를 칸별로 나눈다", () => {
    const groups = groupCardsByColumn(
      [
        card({ id: 1, startDate: "2026-08-07" }),
        card({ id: 2, startDate: "2026-08-01" }),
        card({ id: 3, isDone: true }),
      ],
      TODAY,
    );
    expect(groups.TODO.map((c) => c.id)).toEqual([1]);
    expect(groups.IN_PROGRESS.map((c) => c.id)).toEqual([2]);
    expect(groups.DONE.map((c) => c.id)).toEqual([3]);
  });
});
