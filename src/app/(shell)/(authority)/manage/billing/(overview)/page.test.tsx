/*
  ⚠️ 회귀 방지 — 2026-08-14 프로덕션에서 결제 전 회사가 사이드바 링크로 이 화면에 그대로
     들어와 `getBillingOverview`의 404(BIL-001)가 새서 에러 화면이 떴다. `middleware.ts`가
     아직 없어 이 페이지가 그 문 역할을 해야 하는데 빠져 있었다 — 다시 빠지면 이 테스트가 잡는다.
*/
jest.mock("server-only", () => ({}));
/*
  ⚠️ 그냥 return하는 mock이면 실제 `redirect()`(호출 즉시 던져서 렌더를 멈추는 함수)와
     달리 아래 코드가 계속 실행된다 — `getBillingOverview`가 불려도 이 mock으로는 못 잡는다.
     `NEXT_REDIRECT`를 던지게 해서 실제 동작과 같게 맞춘다(코드래빗 지적, 2026-08-14).
*/
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
jest.mock("@/mocks/config", () => ({ isMock: false }));

jest.mock("@/features/shell/viewer", () => ({ getViewer: jest.fn() }));
jest.mock("@/features/auth/me", () => ({ getMe: jest.fn(async () => ({ companyId: 7 })) }));

jest.mock("@/features/billing/server", () => ({
  getOnboardingSubscription: jest.fn(),
  getBillingOverview: jest.fn(async () => ({ subscription: {}, payments: [] })),
  getBillingConfig: jest.fn(async () => ({})),
}));

jest.mock("@/lib/permission", () => ({
  canAccessManageScope: jest.fn(() => true),
  canManageBilling: jest.fn(() => true),
}));

jest.mock("@/components/common/access-denied", () => ({
  AccessDenied: () => <div data-testid="access-denied" />,
}));

jest.mock("@/features/billing/components/billing-view", () => ({
  BillingView: () => <div data-testid="billing-view" />,
}));

import { redirect } from "next/navigation";

import {
  getBillingConfig,
  getBillingOverview,
  getOnboardingSubscription,
} from "@/features/billing/server";
import { getViewer } from "@/features/shell/viewer";

import OwnerBillingPage from "./page";

describe("/manage/billing — 결제 전 회사는 여기서 막는다", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getViewer as jest.Mock).mockResolvedValue({ role: "owner" });
  });

  it("구독 상태가 UNPAID면 /subscription으로 돌려보낸다 — 그 뒤 조회는 안 나간다", async () => {
    (getOnboardingSubscription as jest.Mock).mockResolvedValue({ status: "UNPAID" });

    await expect(OwnerBillingPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/subscription");
    // ⚠️ 실제 redirect()는 던져서 렌더를 멈춘다 — 결제 전 회사의 404가 여기까지 오면 안 된다
    expect(getBillingOverview).not.toHaveBeenCalled();
    expect(getBillingConfig).not.toHaveBeenCalled();
  });

  it("ACTIVE면 그대로 통과해 화면을 그린다", async () => {
    (getOnboardingSubscription as jest.Mock).mockResolvedValue({ status: "ACTIVE" });

    const ui = await OwnerBillingPage();

    expect(redirect).not.toHaveBeenCalled();
    expect(ui).toBeTruthy();
  });
});
