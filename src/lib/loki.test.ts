import { pushLokiLog } from "./loki";

describe("Loki push", () => {
  const originalFetch = global.fetch;
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

  afterEach(() => {
    global.fetch = originalFetch;
    errorSpy.mockClear();
  });

  afterAll(() => {
    errorSpy.mockRestore();
  });

  // 로그 요청이 무한정 매달리면 5xx 폭주 때 소켓을 다 먹는다 — 타임아웃 신호가 붙어야 한다.
  it("fetch에 AbortSignal.timeout을 실어 보낸다", () => {
    const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>(
      async () => new Response(null, { status: 204 }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    pushLokiLog("info", "hello");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  // 실패는 삼키지만 서버 콘솔에 스택으로 남기면 진짜 원인 로그가 밀린다 — console.error 금지.
  it("push 실패를 콘솔에 남기지 않는다", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;

    pushLokiLog("error", "실패");
    // catch가 마이크로태스크로 실행되므로 다음 틱까지 기다린다.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
