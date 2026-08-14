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
 * 전용 응답(`GET /api/members/org-chart`) 한 번 호출로 바꿨다. 그 응답은 **팀 단위로
 * 이미 묶여 온다**(`List<OrgChartTeamResponse>`, 담당자 확인 2026-08-14) — 이 테스트는
 * 그 팀 구조를 평평한 명부로 올바르게 펴는지를 잠근다.
 */
describe("listAllManagedMembersForOrgChart — 실서버", () => {
  const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
  const serverApiMock = serverApi as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    requireAccessTokenMock.mockResolvedValue("token");
  });

  function member(id: number, overrides: Partial<Record<string, unknown>> = {}) {
    return {
      memberId: id,
      name: `사원${id}`,
      positionName: null,
      role: "MEMBER",
      isAdmin: false,
      roleLabel: null,
      workStatus: "ACTIVE",
      joinedOn: null,
      ...overrides,
    };
  }

  it("조직도 전용 응답을 한 번만 호출한다", async () => {
    serverApiMock.mockResolvedValueOnce([]);

    await listAllManagedMembersForOrgChart();

    expect(serverApiMock).toHaveBeenCalledTimes(1);
    expect(serverApiMock.mock.calls[0][0]).toBe("/api/members/org-chart");
  });

  it("팀 단위로 묶인 응답을 평평한 명부로 편다 — 순서를 그대로 유지한다", async () => {
    serverApiMock.mockResolvedValueOnce([
      { teamName: null, members: [member(1, { role: "OWNER" })] },
      { teamName: "개발팀", members: [member(2), member(3)] },
      { teamName: "디자인팀", members: [member(4)] },
    ]);

    const roster = await listAllManagedMembersForOrgChart();

    expect(roster.map((m) => m.id)).toEqual([1, 2, 3, 4]);
    expect(roster.map((m) => m.teamName)).toEqual([null, "개발팀", "개발팀", "디자인팀"]);
  });

  it("삭제된 사람은 뺀다 — 퇴사자는 남는다", async () => {
    serverApiMock.mockResolvedValueOnce([
      {
        teamName: "개발팀",
        members: [
          member(1),
          member(2, { workStatus: "DELETED" }),
          member(3, { workStatus: "RESIGNED" }),
        ],
      },
    ]);

    const roster = await listAllManagedMembersForOrgChart();

    expect(roster.map((m) => m.id)).toEqual([1, 3]);
  });
});
