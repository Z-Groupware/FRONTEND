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
    ⚠️ **5xx만 꼬리표를 달고 나온다**(2026-08-12). 화면마다 배선하면 14곳을 건드리고 새 화면이
       생길 때마다 잊는다 — 문장을 만드는 이 한 곳에서 붙이면 어디서 띄우든 따라온다.
  */
  it("사람이 어쩔 수 없는 실패(5xx)에는 꼬리표가 따라붙는다", () => {
    expect(
      toUserMessage(new ApiError(500, "서버 내부 오류가 발생했습니다.", "Z-003", "8f21c0")),
    ).toBe("서버 내부 오류가 발생했습니다. (Z-003 · 8f21c0)");
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

  /*
    ⚠️ **4xx에는 안 붙인다.** 사람이 고칠 수 있는 실패라 문장이 이미 할 일을 말한다 —
       `이미 있는 부서 이름입니다`에 `AU-016`을 붙여 봐야 화면만 기술적으로 보인다.
  */
  it("사람이 고칠 수 있는 실패(4xx)에는 안 붙는다", () => {
    expect(
      toErrorTag(new ApiError(409, "이미 있는 부서 이름입니다.", "AU-016", "8f21c0")),
    ).toBeNull();
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

  /*
    ⚠️ **기본값 자체를 잰다.** 전에는 `signal`이 `AbortSignal`인지만 봤는데, `serverApi`는 어떤
       경우에도 신호를 넣으므로 그 단언은 **"끊기는 신호"가 아니라 "신호 객체"** 만 확인했다 —
       기본값을 4시간으로 바꿔도 통과했다(적대적 리뷰 2026-08-12). 굳는 화면을 막으려고 넣은
       값인데 정작 그 값이 사라져도 초록불이면, 이 테스트는 없느니만 못하다.
    ⚠️ 반대 방향도 같이 막는다 — 1.5초 같은 오타로 **멀쩡한 요청을 끊는 회귀**도 잡아야 한다.
  */
  it("아무 말이 없어도 15초에 끊는다 — 그 전에는 기다리고, 넘기면 끊는다", async () => {
    jest.useFakeTimers();
    global.fetch = mockNeverAnswers() as never;

    let settled = false;
    void serverApi("/api/x").catch(() => {
      settled = true;
    });

    await jest.advanceTimersByTimeAsync(14_000);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(2_000);
    expect(settled).toBe(true);

    jest.useRealTimers();
  });

  it("부르는 쪽 신호도 살아 있다 — 타임아웃이 그것을 덮어쓰지 않는다", async () => {
    global.fetch = mockNeverAnswers() as never;
    const controller = new AbortController();
    controller.abort(new DOMException("사용자가 취소했습니다.", "AbortError"));

    const error = await serverApi("/api/x", { signal: controller.signal }).catch((e: unknown) => e);

    expect((error as DOMException).name).toBe("AbortError");
  });
});
