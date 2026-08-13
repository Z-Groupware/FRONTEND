import type { DepartmentNode } from "@/features/company/types";

import { buildTeamRoles, isRoleOfTeam, toBeRoleLabel } from "./team-roles";

const TEAMS: DepartmentNode[] = [
  {
    id: "d1",
    name: "개발팀",
    children: [
      { id: "r1", name: "프론트엔드", children: [] },
      { id: "r2", name: "백엔드", children: [] },
    ],
  },
  { id: "d2", name: "전략기획팀", children: [] },
];

describe("buildTeamRoles", () => {
  it("팀 이름에 그 팀의 역할만 매단다", () => {
    expect(buildTeamRoles(TEAMS)).toEqual({
      개발팀: ["프론트엔드", "백엔드"],
      전략기획팀: [],
    });
  });
});

describe("isRoleOfTeam", () => {
  const roles = buildTeamRoles(TEAMS);

  it("그 팀의 역할이면 통과한다", () => {
    expect(isRoleOfTeam(roles, "개발팀", "백엔드")).toBe(true);
  });

  /* ⚠️ 역할은 팀에 매여 있다 — 남의 팀 역할을 붙이면 조직도가 거짓말을 한다 */
  it("다른 팀의 역할이면 막는다", () => {
    expect(isRoleOfTeam(roles, "전략기획팀", "백엔드")).toBe(false);
  });

  it("`없음`(빈 값)은 늘 통과한다 — 역할은 안 붙여도 되는 값이다", () => {
    expect(isRoleOfTeam(roles, "개발팀", "")).toBe(true);
    expect(isRoleOfTeam(roles, "전략기획팀", "")).toBe(true);
  });

  it("모르는 팀이면 막는다 — 빈 값만 예외다", () => {
    expect(isRoleOfTeam(roles, "없는팀", "백엔드")).toBe(false);
  });
});

describe("toBeRoleLabel — BE 요청 값 변환", () => {
  /*
    ⚠️ 빈 문자열을 그대로 보내면 BE `@Pattern`이 400으로 거절하고, `null`은 "안 바꾼다"라
       비우기에 못 쓴다 — 비우기는 문자열 `"없음"`이다([확인] BE `UpdateMemberRoleRequest`).
       이 변환이 무너지면 역할을 비운 저장이 전부 400으로 튕긴다.
  */
  it("빈 값은 `없음`으로 바꾼다 — 그대로 보내면 400이다", () => {
    expect(toBeRoleLabel("")).toBe("없음");
  });

  it("공백뿐인 값도 `없음`이다 — BE 패턴이 공백을 빈 값으로 본다", () => {
    expect(toBeRoleLabel("   ")).toBe("없음");
  });

  it("값이 있으면 다듬어서 그대로 보낸다", () => {
    expect(toBeRoleLabel("백엔드")).toBe("백엔드");
    expect(toBeRoleLabel(" 프론트엔드 ")).toBe("프론트엔드");
  });
});
