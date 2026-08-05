// 서버 액션은 next 런타임 함수를 부른다 — jsdom엔 없으니 목으로 대체하고 호출만 검증한다.
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { revalidatePath } from "next/cache";

import { createPersonalTodoAction, toggleTodoCompletionAction } from "./actions";
import { addMockTodo } from "./mock/events";

const revalidatePathMock = revalidatePath as unknown as jest.Mock;

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
};

beforeEach(() => {
  revalidatePathMock.mockClear();
});

describe("개인 Todo 작성", () => {
  it("제목·날짜가 있으면 성공하고 생성값을 돌려준다", async () => {
    const result = await createPersonalTodoAction(
      { errors: {} },
      form({ title: "새 할일", date: "2026-09-01" }),
    );

    expect(result.errors).toEqual({});
    expect(result.created?.title).toBe("새 할일");
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/calendar");
  });

  it("제목이 비면 막고 revalidatePath를 안 부른다", async () => {
    const result = await createPersonalTodoAction(
      { errors: {} },
      form({ title: "", date: "2026-09-01" }),
    );

    expect(result.errors.title).toBeDefined();
    expect(result.created).toBeUndefined();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("날짜가 올바르지 않으면 막는다", async () => {
    const result = await createPersonalTodoAction(
      { errors: {} },
      form({ title: "제목", date: "2026-02-30" }),
    );

    expect(result.errors.date).toBeDefined();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("개인 Todo 완료 토글", () => {
  it("개인 Todo는 토글되고 경로를 재검증한다", async () => {
    const created = addMockTodo({ title: "토글 대상", date: "2026-09-02" });

    await toggleTodoCompletionAction(created.id);

    expect(revalidatePathMock).toHaveBeenCalledWith("/app/calendar");
  });

  // ⚠️ 개인 액션은 이 화면이 아니라 다른 화면에서 완료 처리한다 — id로 우회 요청해도 막혀야 한다.
  it("개인 액션 id는 거부한다", async () => {
    await expect(toggleTodoCompletionAction("action-1")).rejects.toThrow();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("없는 id는 거부한다", async () => {
    await expect(toggleTodoCompletionAction("존재하지-않음")).rejects.toThrow();
  });
});
