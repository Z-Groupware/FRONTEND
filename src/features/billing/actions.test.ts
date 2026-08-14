jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/shell/viewer", () => ({ getViewer: jest.fn() }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  serverApi: jest.fn(),
  toUserMessage: jest.fn((error: unknown) => (error as Error).message),
}));

import { revalidatePath } from "next/cache";

import { AUTHORITY } from "@/constants/authority";
import { requireAccessToken } from "@/features/auth/session";
import { getViewer } from "@/features/shell/viewer";
import { serverApi } from "@/lib/api";

import { confirmSubscriptionAction } from "./actions";

/**
 * `confirmSubscriptionAction` — 2026-08-14 복원. 화면 값이 아니라 **BE 응답으로** 성공을
 * 판정하는지, 결제수단 미등록(`NO_PAYMENT_METHOD`)이 사람이 읽을 문구로 바뀌는지를 잠근다.
 */

const getViewerMock = getViewer as unknown as jest.Mock;
const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
const serverApiMock = serverApi as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getViewerMock.mockResolvedValue({ id: 1, role: AUTHORITY.OWNER });
  requireAccessTokenMock.mockResolvedValue("token");
});

describe("confirmSubscriptionAction — 실서버", () => {
  it("BE가 성공을 돌려주면 구독을 읽는 화면 둘 다 갱신한다", async () => {
    serverApiMock.mockResolvedValue({ isSuccess: true });

    const result = await confirmSubscriptionAction();

    expect(result).toEqual({ isSuccess: true });
    expect(revalidatePath).toHaveBeenCalledWith("/manage/billing");
    expect(revalidatePath).toHaveBeenCalledWith("/subscription");
  });

  it("결제 수단이 없으면 BE 코드를 사람이 읽을 문구로 바꾼다 — BE 문자열을 그대로 안 띄운다", async () => {
    serverApiMock.mockResolvedValue({ isSuccess: false, failureCode: "NO_PAYMENT_METHOD" });

    const result = await confirmSubscriptionAction();

    expect(result).toEqual({ isSuccess: false, message: "등록된 결제 수단이 없습니다" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("구독 관리 권한이 없으면 BE를 부르지 않고 막는다", async () => {
    getViewerMock.mockResolvedValue({ id: 4, role: AUTHORITY.MEMBER });

    const result = await confirmSubscriptionAction();

    expect(result.isSuccess).toBe(false);
    expect(serverApiMock).not.toHaveBeenCalled();
  });
});
