/*
  ⚠️ `api.ts`는 `server-only`라 jsdom에서 그대로 못 읽는다 — 그 표식만 빈 모듈로 바꾼다.
     검사 대상은 서버 자원을 안 만지는 두 순수 함수(`toUserMessage`·`toErrorTag`)다.
*/
jest.mock("server-only", () => ({}));

import { ApiError, toErrorTag, toUserMessage } from "./api";

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
