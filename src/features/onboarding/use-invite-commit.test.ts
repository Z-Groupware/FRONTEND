import { act, renderHook, waitFor } from "@testing-library/react";

import { AUTHORITY } from "@/constants/domain";

import type { DepartmentNode, Invite, Position } from "./types";
import { useInviteCommit } from "./use-invite-commit";

const commitOnboardingAction = jest.fn();
jest.mock("./actions", () => ({
  commitOnboardingAction: (...args: unknown[]) => commitOnboardingAction(...args),
}));

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn() }) }));

const DEPARTMENTS: DepartmentNode[] = [{ id: "d1", name: "개발팀", children: [] }];
const POSITIONS: Position[] = [{ id: "p1", name: "팀장", role: AUTHORITY.LEADER }];
const INVITE: Invite = {
  id: "i1",
  name: "",
  email: "user1@example.com",
  departmentId: "d1",
  roleId: "__leader-role__",
  positionId: "p1",
  isAdmin: false,
  isSent: false,
};

function setup() {
  return renderHook(() =>
    useInviteCommit({
      invites: [INVITE],
      sendable: [INVITE],
      departments: DEPARTMENTS,
      positions: POSITIONS,
      markSent: jest.fn(),
    }),
  );
}

beforeEach(() => {
  commitOnboardingAction.mockReset();
});

describe("useInviteCommit — 실패했을 때 버튼을 되살린다", () => {
  it("서버가 실패로 답하면 사유와 꼬리표를 함께 남긴다", async () => {
    commitOnboardingAction.mockResolvedValue({
      ok: false,
      error: "서버 내부 오류가 발생했습니다.",
      errorTag: "Z-003 · 8f21c0",
      issuedEmails: [],
      skipped: [],
    });

    const { result } = setup();
    await act(async () => result.current.commit());

    await waitFor(() => expect(result.current.isCommitting).toBe(false));
    expect(result.current.error).toBe("서버 내부 오류가 발생했습니다.");
    expect(result.current.errorTag).toBe("Z-003 · 8f21c0");
  });

  /*
    ⚠️ **이게 [등록 중]에 굳던 자리다**(2026-08-12). 액션은 BE 실패를 `{ok:false}`로 돌려주지만,
       브라우저에서 Next 서버까지 가는 길이 끊기면 `await` 자체가 던진다 — 그때 실패 분기를
       못 타서 버튼이 영영 잠긴 채로 남았다. `serverApi`의 타임아웃은 이 구간을 못 지킨다.
  */
  it("액션 호출 자체가 던져도 잠기지 않는다 — 굳으면 새로고침 말고는 길이 없다", async () => {
    commitOnboardingAction.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = setup();
    await act(async () => result.current.commit());

    await waitFor(() => expect(result.current.isCommitting).toBe(false));
    expect(result.current.error).toBe("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  });
});
