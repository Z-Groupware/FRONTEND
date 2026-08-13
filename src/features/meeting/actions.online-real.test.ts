// 서버 액션은 next 런타임 함수를 부른다 — jsdom엔 없으니 목으로 대체하고 호출만 검증한다.
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
// 이 파일만 실서버 분기를 본다(`actions.attendees-real.test.ts`와 같은 패턴).
jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/shell/viewer", () => ({
  getViewer: jest.fn(() => Promise.resolve({ id: 1, role: "OWNER" })),
}));
jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  serverApi: jest.fn(),
}));

import { serverApi } from "@/lib/api";

import { createOnlineMeetingAction } from "./actions";

const serverApiMock = serverApi as unknown as jest.Mock;

const VALID_FORM = () => {
  const data = new FormData();
  data.append("title", "비대면 주간 싱크");
  data.append("projectId", "1");
  data.append("attendeeIds", "2");
  data.append("topicMain", "제품");
  data.append("topicSub", "로드맵 검토");
  return data;
};

/*
  ⚠️ BE API가 아직 안 정해졌다(1안/2안 논의 중, 이슈 #473) — 추측 요청을 보내지 않는다
     (CLAUDE.md §연동 검증: Swagger·구두 추측 금지). 확정되기 전까지 실서버 분기는 정직하게
     "아직 준비 중"이라고만 말하고, `serverApi`를 절대 부르지 않아야 한다.
*/
describe("비대면 회의 만들기(이슈 #473) — 실서버 분기(!isMock)", () => {
  beforeEach(() => {
    serverApiMock.mockClear();
  });

  it("아직 준비 중이라는 오류를 돌려주고 serverApi를 부르지 않는다", async () => {
    const result = await createOnlineMeetingAction({ errors: {} }, VALID_FORM());

    expect(result.errors.title).toBe("비대면 회의는 아직 준비 중입니다 — 곧 지원됩니다");
    expect(result.created).toBeUndefined();
    expect(serverApiMock).not.toHaveBeenCalled();
  });

  it("폼 자체가 비어 있으면 그 검증 오류가 먼저 온다(실서버 안내보다 앞선다)", async () => {
    const result = await createOnlineMeetingAction({ errors: {} }, new FormData());

    expect(result.errors.title).toBe("회의 제목을 입력해 주세요");
    expect(serverApiMock).not.toHaveBeenCalled();
  });
});
