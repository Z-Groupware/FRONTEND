/*
  ⚠️ `api.ts`는 `server-only`라 jsdom에서 그대로 못 읽는다 — 그 표식만 빈 모듈로 바꾼다.
     검사 대상은 서버 자원을 안 만지는 두 순수 함수(`toUserMessage`·`toErrorTag`)다.
*/
jest.mock("server-only", () => ({}));

import { ApiError, serverApi, toErrorTag, toUserMessage } from "./api";

describe("toUserMessage", () => {
  it("BE가 준 문장을 그대로 쓴다 — 코드로 문구를 조립하지 않는다", () => {
    expect(toUserMessage(new ApiError(409, "이미 있는 부서 이름입니다.", "AU-016"))).toBe(
      "이미 있는 부서 이름입니다.",
    );
  });

  /*
    ⚠️ **기다리다 끊긴 것과 못 붙은 것을 가른다**(2026-08-12). 배포에서 서버가 답을 안 해
       버튼이 [등록 중]에서 굳었는데, 그때 사람이 할 일은 "다시 눌러 보기"가 아니라
       "잠시 뒤"다 — 두 경우에 같은 말을 하면 헛되이 다시 누른다(§정직성).
  */
  it("시간이 넘긴 것은 못 붙은 것과 다르게 말한다", () => {
    const timeout = new DOMException("The operation timed out.", "TimeoutError");

    expect(toUserMessage(timeout)).toBe("서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.");
    expect(toUserMessage(new TypeError("fetch failed"))).toBe(
      "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });
});

describe("toErrorTag", () => {
  it("코드와 추적 번호를 이어 붙인다 — 백엔드가 로그를 찾을 열쇠다", () => {
    expect(toErrorTag(new ApiError(500, "서버 내부 오류가 발생했습니다.", "Z-003", "8f21c0"))).toBe(
      "Z-003 · 8f21c0",
    );
  });

  it("한쪽만 와도 그 한쪽을 준다", () => {
    expect(toErrorTag(new ApiError(500, "서버 내부 오류가 발생했습니다.", "Z-003"))).toBe("Z-003");
  });

  /* ⚠️ 없으면 `null`이다 — 화면이 `오류 코드 ` 뒤에 빈칸만 그리면 안 된다 */
  it("BE가 준 실패가 아니거나 단서가 없으면 아무것도 안 준다", () => {
    expect(toErrorTag(new ApiError(500, "서버 내부 오류가 발생했습니다."))).toBeNull();
    expect(toErrorTag(new TypeError("fetch failed"))).toBeNull();
  });
});

/**
 * `serverApi` 계약 — **무기한 대기를 막는 자리**라 문구 함수보다 이쪽이 더 중요하다(코드래빗 지적).
 *
 * ⚠️ `fetch`를 대역으로 세운다. 진짜 네트워크를 태우면 테스트가 BE 사정에 따라 흔들린다.
 * ⚠️ 대역은 **신호를 존중해야** 한다 — 실제 `fetch`처럼 `signal`이 끊기면 그 이유로 거절한다.
 *    안 그러면 타임아웃을 걸어 두고도 통과하는 가짜 초록불이 된다.
 */
describe("serverApi", () => {
  const originalFetch = global.fetch;

  function mockJson(status: number, body: unknown) {
    return jest.fn(() =>
      Promise.resolve({
        ok: status < 400,
        status,
        text: () => Promise.resolve(JSON.stringify(body)),
      }),
    );
  }

  /**
   * 신호가 끊길 때까지 답하지 않는 서버.
   * ⚠️ **이미 끊긴 신호도 본다.** 진짜 `fetch`는 그 자리에서 바로 거절하는데, 이벤트만
   *    기다리면 영영 안 온다 — 대역이 실제와 다르면 통과가 거짓말이 된다.
   */
  function mockNeverAnswers() {
    return jest.fn((_url: string, init: { signal?: AbortSignal }) => {
      const signal = init.signal;
      if (signal?.aborted) return Promise.reject(signal.reason);
      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason));
      });
    });
  }

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("성공 봉투에서 `data`만 꺼내 준다 — 부르는 쪽은 봉투를 모른다", async () => {
    global.fetch = mockJson(200, { httpStatus: 200, message: "ok", data: { id: 7 } }) as never;

    await expect(serverApi<{ id: number }>("/api/x")).resolves.toEqual({ id: 7 });
  });

  it("실패 봉투의 `errorCode`·`traceId`를 그대로 들고 온다 — 로그를 찾을 열쇠다", async () => {
    global.fetch = mockJson(500, {
      errorCode: "Z-003",
      message: "서버 내부 오류가 발생했습니다.",
      traceId: "8f21c0",
    }) as never;

    await expect(serverApi("/api/x")).rejects.toMatchObject({
      status: 500,
      code: "Z-003",
      traceId: "8f21c0",
    });
  });

  it("답이 없으면 기다리다 끊는다 — 서버 액션이 영영 안 끝나면 화면이 굳는다", async () => {
    global.fetch = mockNeverAnswers() as never;

    const error = await serverApi("/api/x", { timeoutMs: 10 }).catch((e: unknown) => e);

    expect((error as DOMException).name).toBe("TimeoutError");
    expect(toUserMessage(error)).toBe("서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.");
  });

  it("아무 말이 없어도 상한이 걸려 있다 — 부르는 쪽이 잊어도 굳지 않는다", async () => {
    const fetchMock = mockNeverAnswers();
    global.fetch = fetchMock as never;

    void serverApi("/api/x").catch(() => undefined);

    const init = fetchMock.mock.calls[0]?.[1] as { signal?: AbortSignal };
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("부르는 쪽 신호도 살아 있다 — 타임아웃이 그것을 덮어쓰지 않는다", async () => {
    global.fetch = mockNeverAnswers() as never;
    const controller = new AbortController();
    controller.abort(new DOMException("사용자가 취소했습니다.", "AbortError"));

    const error = await serverApi("/api/x", { signal: controller.signal }).catch((e: unknown) => e);

    expect((error as DOMException).name).toBe("AbortError");
  });
});
