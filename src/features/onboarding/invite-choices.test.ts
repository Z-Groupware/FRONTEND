import { createInviteChoices } from "./invite-choices";
import type { InviteRules } from "./invite-rules";
import type { Invite, SelectOption } from "./types";
import { LEADER_ROLE_ID, LEADER_ROLE_LABEL, NO_ROLE_ID, NO_ROLE_LABEL } from "./types";

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
  /*
    ⚠️ **`없음`은 더 이상 기본 선택지가 아니다.** 전에는 역할 목록 맨 앞에 늘 얹어 두고
       팀장이 그걸 골랐는데, BE에서 `리더`와 `없음`은 서로 다른 역할이라(전역 시드 1·2)
       하나로 뭉뚱그리면 팀장인지 무라벨 팀원인지 구분이 안 된다.
  */
  it("역할이 있는 부서는 그 역할들만 준다 — `없음`은 얹지 않는다", () => {
    const row = invite();
    expect(names(choicesOf([row]).rolesFor(row))).toEqual(["프론트엔드", "백엔드"]);
  });

  it("리더 직급이면 `리더` 하나뿐이다 — 고르는 게 아니라 정해진 값이다", () => {
    const row = invite({ positionId: "lead" });
    expect(names(choicesOf([row]).rolesFor(row))).toEqual([LEADER_ROLE_LABEL]);
  });

  it("역할이 없는 부서는 `없음` 하나뿐이다", () => {
    const row = invite({ departmentId: "ops" });
    expect(names(choicesOf([row]).rolesFor(row))).toEqual([NO_ROLE_LABEL]);
  });
});

describe("positionsFor", () => {
  /*
    ⚠️ **역할로 직급을 막지 않는다.** 이제 직급이 역할을 정한다 — 리더를 고르면 역할이
       `리더`로 덮인다. 전에는 역할에 맞는 직급만 열어서, 실제 역할을 고른 뒤에는 리더로 갈
       길이 막혔다(빠져나가려면 `없음`으로 되돌려야 했는데 그 선택지도 사라졌다).
  */
  it("역할을 골라도 리더 직급이 남는다 — 고르면 역할이 `리더`로 덮인다", () => {
    const row = invite({ roleId: "fe" });
    expect(names(choicesOf([row]).positionsFor(row))).toEqual(["팀장", "과장", "사원"]);
  });

  it("그 부서에 리더가 이미 있으면 리더 직급을 뺀다 — 부서마다 한 명이다", () => {
    const taken = invite({ id: "leader", roleId: LEADER_ROLE_ID, positionId: "lead" });
    const row = invite({ id: "b" });

    expect(names(choicesOf([taken, row]).positionsFor(row))).toEqual(["과장", "사원"]);
  });

  it("그 부서에 리더가 있어도 **자기가 그 리더면** 리더 직급이 남는다", () => {
    const row = invite({ roleId: LEADER_ROLE_ID, positionId: "lead" });
    expect(names(choicesOf([row]).positionsFor(row))).toContain("팀장");
  });

  it("역할이 없는 부서도 직급을 전부 연다", () => {
    const row = invite({ departmentId: "ops", roleId: NO_ROLE_ID });
    expect(names(choicesOf([row]).positionsFor(row))).toEqual(["팀장", "과장", "사원"]);
  });
});

describe("isRoleLocked", () => {
  it("리더 직급이면 잠근다 — 역할은 `리더`로 자동으로 채워진다", () => {
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
