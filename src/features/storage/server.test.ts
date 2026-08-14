jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/lib/api", () => ({ serverApi: jest.fn() }));

import { PROJECT_STATUS } from "@/constants/project";
import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";

import { getStorageOverview } from "./server";

/**
 * 저장소 현황 조회 — 실서버 연동(2026-08-14 BE PR #494).
 *
 * ⚠️ BE `StorageOverviewResponse`가 이 화면의 UI 계약과 필드명을 그대로 맞췄다고
 *    명시했지만, 매퍼를 거치는지·`serverApi`가 봉투를 벗기는지는 실행으로 잠가 둔다 —
 *    "이름이 같다"와 "실제로 그대로 통과한다"는 다른 확인이다.
 */
describe("getStorageOverview — 실서버", () => {
  const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
  const serverApiMock = serverApi as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    requireAccessTokenMock.mockResolvedValue("token");
  });

  it("저장소 엔드포인트를 한 번 불러 그대로 옮긴다", async () => {
    serverApiMock.mockResolvedValueOnce({
      voiceGb: 34.9,
      sttGb: 6.8,
      projects: [
        {
          tag: "product-v2",
          name: "제품 v2.0",
          meetingCount: 24,
          voiceGb: 9.1,
          sttGb: 1.4,
          lastRecordedAt: "2026-08-07",
          status: PROJECT_STATUS.IN_PROGRESS,
        },
      ],
    });

    const overview = await getStorageOverview();

    expect(serverApiMock.mock.calls[0][0]).toBe("/api/companies/me/storage");
    expect(overview).toEqual({
      voiceGb: 34.9,
      sttGb: 6.8,
      projects: [
        {
          tag: "product-v2",
          name: "제품 v2.0",
          meetingCount: 24,
          voiceGb: 9.1,
          sttGb: 1.4,
          lastRecordedAt: "2026-08-07",
          status: PROJECT_STATUS.IN_PROGRESS,
        },
      ],
    });
  });

  /* ⚠️ 빈 회사는 에러가 아니라 0.0GB·빈 배열이다(BE PR #494 본문 — "그 외 도메인 예외는 없다") */
  it("녹음이 하나도 없는 회사는 0GB·빈 목록이다", async () => {
    serverApiMock.mockResolvedValueOnce({ voiceGb: 0, sttGb: 0, projects: [] });

    const overview = await getStorageOverview();

    expect(overview).toEqual({ voiceGb: 0, sttGb: 0, projects: [] });
  });
});
