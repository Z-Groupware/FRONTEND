jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/shell/viewer", () => ({ getViewer: jest.fn() }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/features/company/server", () => ({ getCompanyOrg: jest.fn() }));
jest.mock("@/features/member/manage-server", () => ({ getManagedMember: jest.fn() }));
jest.mock("@/lib/api", () => ({
  serverApi: jest.fn().mockResolvedValue(undefined),
  toUserMessage: jest.fn((error: unknown) => String(error)),
}));

import { AUTHORITY } from "@/constants/authority";
import { requireAccessToken } from "@/features/auth/session";
import { getCompanyOrg } from "@/features/company/server";
import { getViewer } from "@/features/shell/viewer";
import { serverApi } from "@/lib/api";

import { changeMemberGradeAction } from "./manage-actions";
import { getManagedMember } from "./manage-server";
import type { ManagedMember } from "./manage-types";

/**
 * 실서버 분기(`isMock: false`)에서 `PATCH /api/members/{id}`로 나가는 요청 본문 — 특히
 * `roleLabel`.
 *
 * ⚠️ **왜 따로 판다.** 기존 `manage-actions.test.ts`는 파일 전체가 `isMock: true`로
 *    고정돼 있어(모듈 스코프 `jest.mock`), 실서버로 나가는 요청 본문은 그 파일 어디서도
 *    실행되지 않는다 — `roleLabel`을 매번 실어 보내던 버그가 타입 에러 하나로만 드러났고
 *    실행 경로로는 한 번도 검증되지 않았다.
 * ⚠️ **바뀐 게 아니면 필드째 뺀다**(`manage-actions.ts` 주석). BE는 `null`(필드 없음)을
 *    "안 바꾼다"로 읽고 빈 문자열은 400을 낸다 — 매 요청에 값을 실으면 직급만 고쳐도
 *    역할이 함께 써진다(2026-08-13 재발 확인).
 */

const getViewerMock = getViewer as unknown as jest.Mock;
const getCompanyOrgMock = getCompanyOrg as unknown as jest.Mock;
const getManagedMemberMock = getManagedMember as unknown as jest.Mock;
const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
const serverApiMock = serverApi as unknown as jest.Mock;

const OWNER = { id: 1, name: "박대표", role: AUTHORITY.OWNER, isAdmin: false };

function memberOf(overrides: Partial<ManagedMember>): ManagedMember {
  return {
    id: 4,
    name: "박도현",
    email: "dohyun@zgroup.co.kr",
    /*
      ⚠️ 팀은 있어야 `isRoleOfTeam`이 실제로 검사한다. `findTeamLeaderClash`는 권한이
         안 바뀌면(이 테스트들은 authority를 그대로 둔다) `getTeamLeaders()`를 안 불러
         팀이 있어도 추가 목 설정이 필요 없다.
    */
    teamName: "제품팀",
    position: "사원",
    authority: AUTHORITY.MEMBER,
    isAdmin: false,
    roleLabel: "프론트엔드",
    status: "ACTIVE" as ManagedMember["status"],
    joinedAt: "2026-01-01",
    pendingHandoverType: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getViewerMock.mockResolvedValue(OWNER);
  getCompanyOrgMock.mockResolvedValue({
    departments: [
      {
        id: "team-1",
        name: "제품팀",
        children: [
          { id: "role-1", name: "프론트엔드", children: [] },
          { id: "role-2", name: "백엔드", children: [] },
        ],
      },
    ],
    positions: [{ id: 10, name: "사원" }],
  });
  requireAccessTokenMock.mockResolvedValue("token");
  serverApiMock.mockResolvedValue(undefined);
});

describe("changeMemberGradeAction — 실서버 요청 본문의 roleLabel", () => {
  it("역할을 안 바꾸면 요청에 roleLabel 키 자체가 없다", async () => {
    getManagedMemberMock.mockResolvedValue({
      member: memberOf({ roleLabel: "프론트엔드" }),
      actions: [],
      pendingHandover: null,
    });

    const result = await changeMemberGradeAction(4, {
      position: "사원",
      authority: AUTHORITY.MEMBER,
      isAdmin: false,
      roleLabel: "프론트엔드",
    });

    expect(result.isSuccess).toBe(true);
    const [, options] = serverApiMock.mock.calls[0]!;
    expect(options.json).not.toHaveProperty("roleLabel");
  });

  it("roleLabel을 아예 안 넘겨도(직급만 고친 저장) 키가 없다", async () => {
    getManagedMemberMock.mockResolvedValue({
      member: memberOf({ roleLabel: "프론트엔드" }),
      actions: [],
      pendingHandover: null,
    });

    await changeMemberGradeAction(4, {
      position: "사원",
      authority: AUTHORITY.MEMBER,
      isAdmin: false,
    });

    const [, options] = serverApiMock.mock.calls[0]!;
    expect(options.json).not.toHaveProperty("roleLabel");
  });

  it("역할을 실제로 바꾸면 그 값을 싣는다", async () => {
    getManagedMemberMock.mockResolvedValue({
      member: memberOf({ roleLabel: "프론트엔드" }),
      actions: [],
      pendingHandover: null,
    });

    const result = await changeMemberGradeAction(4, {
      position: "사원",
      authority: AUTHORITY.MEMBER,
      isAdmin: false,
      roleLabel: "백엔드",
    });

    expect(result.isSuccess).toBe(true);
    const [, options] = serverApiMock.mock.calls[0]!;
    expect(options.json).toMatchObject({ roleLabel: "백엔드" });
  });

  /*
    ⚠️ **비우기는 막지 않는다** — `team-roles.ts`의 `toBeRoleLabel`이 빈 값을 BE의 실제
       시스템 행 `"없음"`으로 바꿔 보내는, 이미 해결된 길이다. 여기서 막으면 한 번 역할을
       단 사람은 그 뒤로 영영 못 뗀다(2026-08-13 회귀 — 앞선 수정이 이 경로를 잘못 읽고
       "비울 수 없습니다" 오류로 통째로 잠갔었다).
  */
  it("역할을 빈 값으로 바꾸면 '없음'을 실어 보낸다 — 비우기는 이미 되는 길이다", async () => {
    getManagedMemberMock.mockResolvedValue({
      member: memberOf({ roleLabel: "프론트엔드" }),
      actions: [],
      pendingHandover: null,
    });

    const result = await changeMemberGradeAction(4, {
      position: "사원",
      authority: AUTHORITY.MEMBER,
      isAdmin: false,
      roleLabel: "",
    });

    expect(result.isSuccess).toBe(true);
    const [, options] = serverApiMock.mock.calls[0]!;
    expect(options.json).toMatchObject({ roleLabel: "없음" });
  });

  it("이미 역할이 없는 사람에게 빈 값을 다시 보내면(안 바뀜) 키 자체를 안 싣는다", async () => {
    getManagedMemberMock.mockResolvedValue({
      member: memberOf({ roleLabel: null }),
      actions: [],
      pendingHandover: null,
    });

    await changeMemberGradeAction(4, {
      position: "사원",
      authority: AUTHORITY.MEMBER,
      isAdmin: false,
      roleLabel: "",
    });

    const [, options] = serverApiMock.mock.calls[0]!;
    expect(options.json).not.toHaveProperty("roleLabel");
  });
});
