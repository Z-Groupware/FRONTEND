/**
 * `getBillingConfig` — **공개 경로와 인증 경로의 오류 처리가 다르다**(회귀 방지).
 *
 * ⚠️ 공개 요금제(`/plans`)는 토큰 없이 부른다. 여기서 던지면 랜딩에서 들어온 소개
 *    페이지가 통째로 죽는다 — v0 가정값(`MOCK_CONFIG`)으로 낮춘다.
 * ⚠️ 인증 경로(온보딩·구독·관리)는 던져야 한다. 조용히 폴백으로 낮추면 실제
 *    금액 어긋남이 화면에 그대로 뜬다 — 이 회사에 맞는 값이 아니다.
 *
 * PR #431의 coderabbit 지적(2026-08-13)이 다시 들어오면 여기서 잡힌다.
 */
jest.mock("@/features/auth/session", () => ({
  getAccessToken: jest.fn(),
  requireAccessToken: jest.fn(),
}));
jest.mock("@/lib/api", () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message = "api") {
      super(message);
      this.status = status;
    }
  }
  return { ApiError, serverApi: jest.fn() };
});
jest.mock("@/mocks/config", () => ({ isMock: false }));

import { getAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";

import { getBillingConfig } from "./server";

const getAccessTokenMock = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const serverApiMock = serverApi as jest.MockedFunction<typeof serverApi>;

// v0 가정값 — `MOCK_CONFIG`와 같다. 파일이 export하지 않으므로 여기서 재선언한다.
const V0 = {
  baseFee: 150_000,
  includedTokens: 1_500_000,
  includedStorageGb: 50,
  overagePerThousandTokens: 20,
  overagePerGbMonth: 500,
  isVatIncluded: false,
};

beforeEach(() => {
  getAccessTokenMock.mockReset();
  serverApiMock.mockReset();
});

describe("getBillingConfig — 공개(비로그인) 경로", () => {
  it("공개 config 실패 시 v0 가정값으로 폴백한다(랜딩이 죽지 않는다)", async () => {
    getAccessTokenMock.mockResolvedValue(null);
    serverApiMock.mockRejectedValueOnce(new Error("BE #461 미배포 404"));

    const result = await getBillingConfig();

    expect(result).toEqual(V0);
    expect(serverApiMock).toHaveBeenCalledTimes(1);
    // 공개 경로만 부른다 — 인증 경로로 새면 안 된다
    expect(serverApiMock.mock.calls[0]?.[0]).toBe("/api/billing-config");
  });
});

describe("getBillingConfig — 인증 경로", () => {
  it("실서버가 던지면 그대로 던진다(폴백으로 조용히 낮추지 않는다)", async () => {
    getAccessTokenMock.mockResolvedValue("token-abc");
    const err = new Error("BE 500");
    serverApiMock.mockRejectedValueOnce(err);

    await expect(getBillingConfig()).rejects.toBe(err);
    expect(serverApiMock.mock.calls[0]?.[0]).toBe("/api/companies/me/billing-config");
  });
});
