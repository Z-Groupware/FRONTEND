/*
  ⚠️ 회귀 방지 — 2026-08-14 프로덕션에서 결제 전 회사가 사이드바 링크로 이 화면에 그대로
     들어와 `getBillingOverview`의 404(BIL-001)가 새서 에러 화면이 떴다. `middleware.ts`가
     아직 없어 이 페이지가 그 문 역할을 해야 하는데 빠져 있었다 — 다시 빠지면 이 테스트가 잡는다.
*/
jest.mock("server-only", () => ({}));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/mocks/config", () => ({ isMock: false }));

jest.mock("@/features/shell/viewer", () => ({ getViewer: jest.fn() }));

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

import { getOnboardingSubscription } from "@/features/billing/server";
import { getViewer } from "@/features/shell/viewer";

import OwnerBillingPage from "./page";

describe("/manage/billing — 결제 전 회사는 여기서 막는다", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getViewer as jest.Mock).mockResolvedValue({ role: "owner" });
  });

  it("구독 상태가 UNPAID면 /subscription으로 돌려보낸다 — BillingView는 안 그린다", async () => {
    (getOnboardingSubscription as jest.Mock).mockResolvedValue({ status: "UNPAID" });

    await OwnerBillingPage();

    expect(redirect).toHaveBeenCalledWith("/subscription");
  });

  it("ACTIVE면 그대로 통과해 화면을 그린다", async () => {
    (getOnboardingSubscription as jest.Mock).mockResolvedValue({ status: "ACTIVE" });

    const ui = await OwnerBillingPage();

    expect(redirect).not.toHaveBeenCalled();
    expect(ui).toBeTruthy();
  });
});
