jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/lib/api", () => ({ serverApi: jest.fn() }));

import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";

import { listAllManagedMembersForOrgChart } from "./manage-server";

/**
 * 조직도 전체 명부 — 2026-08-14 프로덕션 장애 수정.
 * `GET /api/members`를 페이지 순회하던 이전 구현은 `size` 상한(`@Max(100)`)과
 * OWNER·ADMIN 전용 가드 때문에 `/app/people`(전 구성원용 화면)에서 깨졌다 — BE 조직도
 * 전용 응답(`GET /api/members/org-chart`) 한 번 호출로 바꿨다. 이 테스트는 그 호출이
 * 한 번만 나가고, 응답을 그대로 매핑하는지를 잠근다.
 */
describe("listAllManagedMembersForOrgChart — 실서버", () => {
  const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
  const serverApiMock = serverApi as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    requireAccessTokenMock.mockResolvedValue("token");
  });

  function member(id: number) {
    return {
      memberId: id,
      name: `사원${id}`,
      teamName: "개발팀",
      positionName: null,
      role: "MEMBER",
      isAdmin: false,
      roleLabel: null,
      workStatus: "ACTIVE",
      joinedOn: null,
    };
  }

  it("조직도 전용 응답을 한 번만 호출해 그대로 매핑한다 — 페이지 순회를 안 한다", async () => {
    serverApiMock.mockResolvedValueOnce([member(1), member(2), member(3)]);

    const roster = await listAllManagedMembersForOrgChart();

    expect(serverApiMock).toHaveBeenCalledTimes(1);
    expect(serverApiMock.mock.calls[0][0]).toBe("/api/members/org-chart");
    expect(roster.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("삭제된 사람은 뺀다 — 퇴사자는 남는다", async () => {
    serverApiMock.mockResolvedValueOnce([
      member(1),
      { ...member(2), workStatus: "DELETED" },
      { ...member(3), workStatus: "RESIGNED" },
    ]);

    const roster = await listAllManagedMembersForOrgChart();

    expect(roster.map((m) => m.id)).toEqual([1, 3]);
  });
});
