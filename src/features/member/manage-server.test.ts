jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/lib/api", () => ({ serverApi: jest.fn() }));

import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";

import { listAllManagedMembersForOrgChart } from "./manage-server";

/**
 * 조직도 전체 명부 — 2026-08-14 프로덕션에서 무조건 throw하던 것을 고쳤다.
 * BE에 전체 조회 응답이 없어 **여러 페이지를 순회해 합치는 임시 우회**다(함수 주석 참고) —
 * 이 순회가 실제로 끝까지 도는지, 중복 없이 합치는지를 잠근다.
 */
describe("listAllManagedMembersForOrgChart — 실서버", () => {
  const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
  const serverApiMock = serverApi as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    requireAccessTokenMock.mockResolvedValue("token");
  });

  function page(memberIds: number[], pageIndex: number, totalPages: number) {
    return {
      totalElements: totalPages * memberIds.length,
      totalPages,
      hasNext: pageIndex < totalPages - 1,
      page: pageIndex,
      size: memberIds.length,
      content: memberIds.map((id) => ({
        memberId: id,
        name: `사원${id}`,
        teamName: "개발팀",
        positionName: null,
        role: "MEMBER",
        isAdmin: false,
        roleLabel: null,
        workStatus: "ACTIVE",
        joinedOn: null,
      })),
    };
  }

  it("totalPages만큼 페이지를 순회해 전부 합친다", async () => {
    serverApiMock
      .mockResolvedValueOnce(page([1, 2], 0, 3))
      .mockResolvedValueOnce(page([3, 4], 1, 3))
      .mockResolvedValueOnce(page([5, 6], 2, 3));

    const roster = await listAllManagedMembersForOrgChart();

    expect(serverApiMock).toHaveBeenCalledTimes(3);
    expect(roster.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("첫 페이지에서 totalPages=1이면 한 번만 부른다 — 회사가 작으면 요청도 하나다", async () => {
    serverApiMock.mockResolvedValueOnce(page([1], 0, 1));

    const roster = await listAllManagedMembersForOrgChart();

    expect(serverApiMock).toHaveBeenCalledTimes(1);
    expect(roster).toHaveLength(1);
  });

  /*
    ⚠️ 코드래빗 지적(2026-08-14) — 상한을 넘으면 앞부분만 조용히 정상 리턴하면 안 된다.
       회사 인원이 늘었는데 조직도가 말없이 일부만 보여주는 건 §정직성 위반이다.
  */
  it("상한(20페이지)을 넘으면 잘린 명부를 정상 결과로 돌려주지 않는다 — 던진다", async () => {
    // totalPages=21 — 상한 20을 넘는다. 20번째 응답까지만 mock하면 충분하다(그 이상 안 부른다).
    serverApiMock.mockResolvedValue(page([1], 0, 21));

    await expect(listAllManagedMembersForOrgChart()).rejects.toThrow("상한을 넘어");

    expect(serverApiMock).toHaveBeenCalledTimes(20);
  });
});
