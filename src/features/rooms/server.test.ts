jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/features/member/manage-server", () => ({ getTeamLeaders: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  serverApi: jest.fn(),
}));

import { AUTHORITY } from "@/constants/authority";
import { requireAccessToken } from "@/features/auth/session";
import { getTeamLeaders } from "@/features/member/manage-server";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import type { Actor } from "@/lib/permission";

import { getReservableMembers } from "./server";

/**
 * 참석자 후보 명부 — **실서버 분기가 Owner와 Leader·Member에서 다른 API를 부른다.**
 *
 * ⚠️ Owner는 팀이 없어 `/api/members/my-team`이 빈 배열만 준다(BE 확인) — 그래서 이 분기는
 *    아예 그 API를 안 부르고 `getTeamLeaders()`로 간다. 실수로 두 분기가 뒤섞이면 Owner
 *    화면의 참석자 후보가 조용히 텅 빈다.
 */

const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
const getTeamLeadersMock = getTeamLeaders as unknown as jest.Mock;
const serverApiMock = serverApi as unknown as jest.Mock;

const OWNER: Actor = { id: 1, role: AUTHORITY.OWNER };
const LEADER: Actor = { id: 2, role: AUTHORITY.LEADER, teamName: "개발팀" };
const MEMBER: Actor = { id: 3, role: AUTHORITY.MEMBER, teamName: "개발팀" };

beforeEach(() => {
  jest.clearAllMocks();
  requireAccessTokenMock.mockResolvedValue("token");
});

describe("getReservableMembers — 실서버", () => {
  it("Owner는 팀별 리더 조회(getTeamLeaders)로 후보를 만든다 — my-team API는 안 부른다", async () => {
    getTeamLeadersMock.mockResolvedValue(
      new Map([
        ["개발팀", { id: 2, name: "김서준" }],
        ["마케팅팀", { id: 5, name: "최유진" }],
      ]),
    );

    const members = await getReservableMembers(OWNER);

    expect(members).toEqual([
      { id: 2, name: "김서준", teamName: "개발팀", authority: AUTHORITY.LEADER },
      { id: 5, name: "최유진", teamName: "마케팅팀", authority: AUTHORITY.LEADER },
    ]);
    expect(serverApiMock).not.toHaveBeenCalled();
  });

  it("Leader·Member는 /api/members/my-team을 부르고 자기 팀 이름을 붙인다", async () => {
    serverApiMock.mockResolvedValue([
      { memberId: 2, name: "김서준" },
      { memberId: 4, name: "박도현" },
    ]);

    const members = await getReservableMembers(LEADER);

    expect(serverApiMock).toHaveBeenCalledWith(
      ep.membersMyTeam(),
      expect.objectContaining({ accessToken: "token" }),
    );
    expect(members).toEqual([
      { id: 2, name: "김서준", teamName: "개발팀", authority: AUTHORITY.MEMBER },
      { id: 4, name: "박도현", teamName: "개발팀", authority: AUTHORITY.MEMBER },
    ]);
    expect(getTeamLeadersMock).not.toHaveBeenCalled();
  });

  it("Member도 같은 API를 쓴다 — LEADER와 갈릴 이유가 없다(둘 다 자기 팀 로스터)", async () => {
    serverApiMock.mockResolvedValue([{ memberId: 3, name: "이서연" }]);

    const members = await getReservableMembers(MEMBER);

    expect(members).toEqual([
      { id: 3, name: "이서연", teamName: "개발팀", authority: AUTHORITY.MEMBER },
    ]);
  });
});
