/*
  ⚠️ 2026-08-14 — 이 화면의 결제 전 회사 리다이렉트 가드는 없앴다(`page.tsx` 주석 참고).
     `getBillingOverview`가 이제 항상 더미를 돌려줘 404가 날 수 없다 — 여기서 지키는 건
     "권한 없으면 화면 대신 접근 거부를 그린다"뿐이다.
*/
jest.mock("server-only", () => ({}));

jest.mock("@/features/shell/viewer", () => ({ getViewer: jest.fn() }));

jest.mock("@/features/billing/server", () => ({
  getOnboardingSubscription: jest.fn(),
  getBillingOverview: jest.fn(async () => ({ subscription: {}, payments: [] })),
  getBillingConfig: jest.fn(async () => ({})),
}));

jest.mock("@/lib/permission", () => ({
  canAccessManageScope: jest.fn(),
  canManageBilling: jest.fn(() => true),
}));

jest.mock("@/components/common/access-denied", () => ({
  AccessDenied: () => <div data-testid="access-denied" />,
}));

jest.mock("@/features/billing/components/billing-view", () => ({
  BillingView: () => <div data-testid="billing-view" />,
}));

import { getBillingOverview } from "@/features/billing/server";
import { getViewer } from "@/features/shell/viewer";
import { canAccessManageScope } from "@/lib/permission";

import OwnerBillingPage from "./page";

describe("/manage/billing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getViewer as jest.Mock).mockResolvedValue({ role: "owner" });
  });

  it("관리 스코프 권한이 없으면 접근 거부를 그린다 — 조회는 안 나간다", async () => {
    (canAccessManageScope as jest.Mock).mockReturnValue(false);

    const ui = await OwnerBillingPage();

    expect(ui).toBeTruthy();
    expect(getBillingOverview).not.toHaveBeenCalled();
  });

  it("권한이 있으면 그대로 화면을 그린다", async () => {
    (canAccessManageScope as jest.Mock).mockReturnValue(true);

    const ui = await OwnerBillingPage();

    expect(ui).toBeTruthy();
    expect(getBillingOverview).toHaveBeenCalled();
  });
});
