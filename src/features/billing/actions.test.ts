jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/shell/viewer", () => ({ getViewer: jest.fn() }));
jest.mock("@/lib/api", () => ({ serverApi: jest.fn(), toUserMessage: jest.fn() }));

import { revalidatePath } from "next/cache";

import { AUTHORITY } from "@/constants/authority";
import { getViewer } from "@/features/shell/viewer";
import { serverApi } from "@/lib/api";

import { confirmSubscriptionAction } from "./actions";

/**
 * `confirmSubscriptionAction` — **실서버에서도 결제사를 안 부르는 임시 조치**(2026-08-13,
 * Toss 실연동 여부가 [팀확정] 미정이라 사용자 확정).
 *
 * ⚠️ 화면에 카드 정보를 받는 자리가 없다 — 이 임시 조치 없이 실서버로 나가면
 *    `POST /api/companies/me/subscription/pay`가 `NO_PAYMENT_METHOD`로 영원히 실패해
 *    온보딩이 못 끝난다. 이 테스트는 **그 실패가 되살아나지 않는지**를 잠근다 —
 *    누군가 원래 구현으로 되돌리면서 이 회귀 방지 없이 그러면 여기서 잡힌다.
 */

const getViewerMock = getViewer as unknown as jest.Mock;
const serverApiMock = serverApi as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getViewerMock.mockResolvedValue({ id: 1, role: AUTHORITY.OWNER });
});

describe("confirmSubscriptionAction — 실서버", () => {
  it("BE 결제 API를 부르지 않고 바로 성공을 돌려준다", async () => {
    const result = await confirmSubscriptionAction();

    expect(result).toEqual({ isSuccess: true });
    expect(serverApiMock).not.toHaveBeenCalled();
  });

  it("구독을 읽는 화면 둘 다 갱신한다 — 결제 화면과 재개 화면이 같은 값을 본다", async () => {
    await confirmSubscriptionAction();

    expect(revalidatePath).toHaveBeenCalledWith("/manage/billing");
    expect(revalidatePath).toHaveBeenCalledWith("/subscription");
  });

  /* ⚠️ 권한 문지기는 이 임시 조치와 무관하게 그대로 살아 있어야 한다 */
  it("구독 관리 권한이 없으면 여전히 막는다", async () => {
    getViewerMock.mockResolvedValue({ id: 4, role: AUTHORITY.MEMBER });

    const result = await confirmSubscriptionAction();

    expect(result.isSuccess).toBe(false);
    expect(serverApiMock).not.toHaveBeenCalled();
  });
});
