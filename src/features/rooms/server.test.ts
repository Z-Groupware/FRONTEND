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

import { getReservableMembers, getReservableProjects } from "./server";

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

/**
 * 예약 폼의 "프로젝트" select — 2026-08-14 프로덕션에서 무조건 throw하던 것을 고쳤다.
 * `getProjectsPage`(project 도메인, 이미 실연동)를 그대로 재사용하는지 확인한다.
 */
describe("getReservableProjects — 실서버", () => {
  it("getProjectsPage를 재사용해 select 모양으로 줄인다 — 새 경로를 만들지 않는다", async () => {
    serverApiMock.mockResolvedValue({
      content: [
        {
          id: 12,
          tag: "product-v2",
          color: "blue",
          name: "제품 v2.0",
          description: "",
          status: "IN_PROGRESS",
          startDate: null,
          dueDate: "2026-12-31",
          teamCount: 1,
          actionCount: 0,
          completedActionCount: 0,
          meetingCount: 0,
          progressPct: 0,
          teamNames: [],
        },
      ],
      page: 0,
      size: 200,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    });

    const projects = await getReservableProjects();

    expect(projects).toEqual([{ id: "12", name: "제품 v2.0", tag: "product-v2" }]);
    expect(serverApiMock).toHaveBeenCalledWith(
      expect.stringContaining("status=IN_PROGRESS"),
      expect.objectContaining({ accessToken: "token" }),
    );
    // ⚠️ page·size도 확인한다 — 기본 페이지 크기(20)로 조용히 바뀌어도 status만 보면 통과했다(코드래빗 지적)
    const requestUrl = serverApiMock.mock.calls[0][0] as string;
    expect(requestUrl).toContain("page=0");
    expect(requestUrl).toContain("size=200"); // select 한 번에 받을 상한(RESERVABLE_PROJECTS_PAGE_SIZE)
  });
});
