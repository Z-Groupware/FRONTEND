jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/lib/api", () => ({ serverApi: jest.fn(), ApiError: class ApiError extends Error {} }));

import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";

import { getManagedMember, listAllManagedMembersForOrgChart } from "./manage-server";

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

  /*
    ⚠️ **`members` 필드가 없는 팀도 있을 수 있다**(2026-08-14 프로덕션 재현) — 이 shape은
       [가정 shape·미검증]이라 사람이 없는 팀에서 BE가 `members`를 빈 배열이 아니라
       필드째 빼고 줄 가능성을 배제할 수 없다. 그때 죽지 않고 그 팀만 빈 것으로 본다.
  */
  it("members 필드가 없는 팀이 와도 죽지 않는다", async () => {
    serverApiMock.mockResolvedValueOnce([
      { teamName: "개발팀", members: [member(1)] },
      { teamName: "신규팀" },
    ]);

    const roster = await listAllManagedMembersForOrgChart();

    expect(roster.map((m) => m.id)).toEqual([1]);
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

/**
 * 사원 상세 실서버 조회 — `roleId` 정규화(2026-08-14 프로덕션 재현).
 *
 * ⚠️ **`manage-actions.role-id.test.ts`는 이 실코드를 안 지난다** — 그 파일은
 *    `getManagedMember` 자체를 `jest.mock`으로 통째로 갈아치운다. `!= null`(BE PR #489
 *    미배포 시 `undefined`도 걸러야 한다)이 실제로 지켜지는지는 여기서만 잠긴다 — 나중에
 *    누가 `eqeqeq` 린트에 맞춰 `!==`로 되돌려도 다른 테스트는 못 잡는다.
 */
describe("getManagedMember — 실서버 roleId", () => {
  const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
  const serverApiMock = serverApi as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    requireAccessTokenMock.mockResolvedValue("token");
  });

  function detail(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      memberId: 4,
      name: "박도현",
      teamName: "개발팀",
      positionName: "사원",
      role: "MEMBER",
      isAdmin: false,
      roleLabel: null,
      workStatus: "ACTIVE",
      joinedOn: "2023-01-15",
      teamId: 1,
      jobPositionId: 1,
      email: "dohyun@zgroup.co.kr",
      ...overrides,
    };
  }

  /** 담당 액션·대기 신청 조회는 이 테스트의 관심사가 아니다 — 빈 값으로 통일해 둔다 */
  function stubSideCalls() {
    serverApiMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/handovers")) return Promise.resolve([]);
      if (url.startsWith("/api/company/actions")) {
        return Promise.resolve({ content: [], totalElements: 0 });
      }
      throw new Error(`이 테스트가 예상하지 않은 serverApi 호출: ${url}`);
    });
  }

  it("BE에 roleId 필드 자체가 없으면(#489 미배포) null이다 — 문자열 'undefined'가 아니다", async () => {
    stubSideCalls();
    serverApiMock.mockImplementationOnce((url: string) => {
      expect(url).toBe("/api/members/4");
      return Promise.resolve(detail({ roleId: undefined }));
    });

    const result = await getManagedMember(4);

    expect(result?.roleId).toBeNull();
  });

  it("BE가 roleId를 실제로 주면 문자열로 옮긴다", async () => {
    stubSideCalls();
    serverApiMock.mockImplementationOnce((url: string) => {
      expect(url).toBe("/api/members/4");
      return Promise.resolve(detail({ roleId: 3 }));
    });

    const result = await getManagedMember(4);

    expect(result?.roleId).toBe("3");
  });

  it("roleId가 명시적으로 null이면 그대로 null이다", async () => {
    stubSideCalls();
    serverApiMock.mockImplementationOnce((url: string) => {
      expect(url).toBe("/api/members/4");
      return Promise.resolve(detail({ roleId: null }));
    });

    const result = await getManagedMember(4);

    expect(result?.roleId).toBeNull();
  });
});
