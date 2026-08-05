import { createInviteChoices } from "./invite-choices";
import type { InviteRules } from "./invite-rules";
import type { Invite, SelectOption } from "./types";
import { NO_ROLE_ID, NO_ROLE_LABEL } from "./types";

/**
 * 선택지를 추리는 규칙 — **막다른 길을 안 만드는 것**이 핵심이다.
 * 고를 수 있는 것만 보여주되, 그 줄이 빠져나갈 길은 남겨 둬야 한다.
 */

const POSITIONS: SelectOption[] = [
  { id: "lead", name: "팀장" },
  { id: "senior", name: "과장" },
  { id: "staff", name: "사원" },
];

/** 개발팀에는 역할이 둘, 경영지원에는 하나도 없다(1단계에서 비워둘 수 있다) */
const ROLES: Record<string, SelectOption[]> = {
  dev: [
    { id: "fe", name: "프론트엔드" },
    { id: "be", name: "백엔드" },
  ],
  ops: [],
};

const rules: InviteRules = {
  isLeaderPosition: (positionId) => positionId === "lead",
  hasRoles: (departmentId) => (ROLES[departmentId] ?? []).length > 0,
};

const invite = (patch: Partial<Invite> = {}): Invite => ({
  id: "a",
  name: "",
  email: "",
  departmentId: "dev",
  roleId: "",
  positionId: "",
  isAdmin: false,
  isSent: false,
  ...patch,
});

const choicesOf = (invites: Invite[]) =>
  createInviteChoices({
    invites,
    rolesOf: (departmentId) => ROLES[departmentId] ?? [],
    positionOptions: POSITIONS,
    isLeaderPosition: rules.isLeaderPosition,
    rules,
  });

const names = (options: SelectOption[]) => options.map((option) => option.name);

describe("rolesFor", () => {
  it("부서 안의 역할들 **앞에** `없음`을 둔다 — 팀장을 넣을 때 가장 먼저 찾는 항목이다", () => {
    const row = invite();
    expect(names(choicesOf([row]).rolesFor(row))).toEqual([NO_ROLE_LABEL, "프론트엔드", "백엔드"]);
  });

  it("그 부서에 리더가 이미 있으면 `없음`을 뺀다 — 고르는 순간 직급이 비는 막다른 길이다", () => {
    const taken = invite({ id: "leader", roleId: NO_ROLE_ID, positionId: "lead" });
    const row = invite({ id: "b" });

    expect(names(choicesOf([taken, row]).rolesFor(row))).toEqual(["프론트엔드", "백엔드"]);
  });

  it("이미 `없음`인 줄에서는 리더가 차 있어도 `없음`을 남긴다 — 자기 값이 사라지면 안 된다", () => {
    const taken = invite({ id: "leader", roleId: NO_ROLE_ID, positionId: "lead" });
    const row = invite({ id: "b", roleId: NO_ROLE_ID });

    expect(names(choicesOf([taken, row]).rolesFor(row))).toContain(NO_ROLE_LABEL);
  });

  it("역할이 없는 부서는 `없음` 하나뿐이다", () => {
    const row = invite({ departmentId: "ops" });
    expect(names(choicesOf([row]).rolesFor(row))).toEqual([NO_ROLE_LABEL]);
  });
});

describe("positionsFor", () => {
  it("역할을 고른 줄에서는 리더 직급을 뺀다 — 리더는 부서 전체를 맡아 한 역할에 못 매인다", () => {
    const row = invite({ roleId: "fe" });
    expect(names(choicesOf([row]).positionsFor(row))).toEqual(["과장", "사원"]);
  });

  it("`없음`을 고른 줄에서는 리더 직급만 남는다", () => {
    const row = invite({ roleId: NO_ROLE_ID });
    expect(names(choicesOf([row]).positionsFor(row))).toEqual(["팀장"]);
  });

  it("그 부서에 리더가 이미 있으면 리더 직급을 뺀다 — 부서마다 한 명이다", () => {
    const taken = invite({ id: "leader", roleId: NO_ROLE_ID, positionId: "lead" });
    const row = invite({ id: "b", roleId: NO_ROLE_ID });

    expect(names(choicesOf([taken, row]).positionsFor(row))).toEqual([]);
  });

  /*
    ⚠️ 짝이 어긋난 줄은 **실제로 생긴다.** 직급을 팀장으로 고른 뒤 역할을 프론트엔드로 바꾸면
       그 순간 `과장 + 팀장`처럼 규칙에 안 맞는 조합이 잠깐 남는다(`changeInviteRole`가
       직급을 비우기 전 렌더). 이때 지금 값이 목록에서 빠지면 칸이 무엇으로 정해졌는지
       못 보여준다 — 자기 값은 규칙과 무관하게 남긴다.
  */
  it("규칙에 어긋나더라도 **지금 고른 값**은 남긴다 — 칸이 무엇으로 정해졌는지 보여야 한다", () => {
    const row = invite({ roleId: "fe", positionId: "lead" });
    expect(names(choicesOf([row]).positionsFor(row))).toContain("팀장");
  });

  it("그 부서에 리더가 있어도 **자기가 그 리더면** 리더 직급이 남는다", () => {
    const row = invite({ roleId: NO_ROLE_ID, positionId: "lead" });
    expect(names(choicesOf([row]).positionsFor(row))).toContain("팀장");
  });

  it("역할이 없는 부서는 직급을 전부 연다 — 규칙을 그대로 적용하면 팀장만 들어갈 수 있다", () => {
    const row = invite({ departmentId: "ops", roleId: NO_ROLE_ID });
    expect(names(choicesOf([row]).positionsFor(row))).toEqual(["팀장", "과장", "사원"]);
  });
});

describe("isRoleLocked", () => {
  it("리더 직급이면 잠근다 — 역할은 `없음` 하나뿐이다", () => {
    const row = invite({ positionId: "lead" });
    expect(choicesOf([row]).isRoleLocked(row)).toBe(true);
  });

  it("역할이 없는 부서면 잠근다 — 이미 `없음`으로 정해져 있다", () => {
    const row = invite({ departmentId: "ops" });
    expect(choicesOf([row]).isRoleLocked(row)).toBe(true);
  });

  it("그 밖에는 열어 둔다", () => {
    const row = invite({ positionId: "staff" });
    expect(choicesOf([row]).isRoleLocked(row)).toBe(false);
  });
});
