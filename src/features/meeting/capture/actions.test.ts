/**
 * CAP-09 진행 중 캡처 조회(`getActiveCaptureAction`) 실서버 분기 회귀 테스트.
 *
 * ⚠️ **화면이 죽으면 안 되는 값이 셋이다.**
 *   - `data: null`(진행 중 없음) → 오류로 올리지 않고 그대로 null
 *   - 정상 응답 → captureSessionId 같은 안 쓰는 필드는 계약에서 뺀다
 *   - 예외(권한 없음 등) → 던지지 않고 `{ok:false, error}`로 감싸 화면이 무시할 수 있게
 */

jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    code?: string;
    constructor(status: number, message: string, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
  serverApi: jest.fn(),
  toUserMessage: (error: unknown) =>
    error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
}));

import { requireAccessToken } from "@/features/auth/session";
import { ApiError, serverApi } from "@/lib/api";

import { getActiveCaptureAction } from "./actions";

const serverApiMock = serverApi as unknown as jest.Mock;
const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  requireAccessTokenMock.mockResolvedValue("token");
});

describe("getActiveCaptureAction — CAP-09", () => {
  it("진행 중 캡처가 없으면(data:null) 오류가 아니라 그대로 null을 돌려준다", async () => {
    serverApiMock.mockResolvedValueOnce(null);

    const result = await getActiveCaptureAction();

    expect(result).toEqual({ ok: true, data: null });
  });

  it("진행 중 캡처가 있으면 안 쓰는 captureSessionId를 뺀 계약으로 옮긴다", async () => {
    serverApiMock.mockResolvedValueOnce({
      meetingId: 91,
      captureSessionId: 1204, // 계약에서 뺀다
      segmentSeq: 3,
      lastSeq: 42,
      recorderPersonId: 7,
      canTakeover: false,
      elapsedMs: 12_345,
    });

    const result = await getActiveCaptureAction();

    expect(result).toEqual({
      ok: true,
      data: {
        meetingId: 91,
        segmentSeq: 3,
        lastSeq: 42,
        recorderPersonId: 7,
        canTakeover: false,
        elapsedMs: 12_345,
      },
    });
  });

  it("녹음자 하트비트가 끊긴 상태(canTakeover:true, recorderPersonId:null)도 그대로 옮긴다", async () => {
    serverApiMock.mockResolvedValueOnce({
      meetingId: 91,
      captureSessionId: null,
      segmentSeq: 0,
      lastSeq: 0,
      recorderPersonId: null,
      canTakeover: true,
      elapsedMs: 0,
    });

    const result = await getActiveCaptureAction();

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      meetingId: 91,
      segmentSeq: 0,
      lastSeq: 0,
      recorderPersonId: null,
      canTakeover: true,
      elapsedMs: 0,
    });
  });

  /*
    ⚠️ 던지지 않고 값으로 돌려준다 — 훅이 알림/화면 오류로 올리지 않고 조용히 무시하므로
       (복구 안내가 없더라도 나머지 캡처 흐름은 돌아야 한다), 여기서 예외가 새면 훅 마운트
       효과 안에서 unhandled rejection이 된다.
  */
  it("예외는 던지지 않고 {ok:false}로 감싼다", async () => {
    serverApiMock.mockRejectedValueOnce(new ApiError(403, "이 회의 참석자가 아닙니다"));

    const result = await getActiveCaptureAction();

    expect(result.ok).toBe(false);
    expect(result.error).toBe("이 회의 참석자가 아닙니다");
  });
});
