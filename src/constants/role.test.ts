import { ROLE, ROLE_BADGE_CLASS, ROLE_LABEL, ROLE_MARK_CLASS } from "./role";

/**
 * 역할 배지 — **색이 역할을 따라가는지**가 핵심이다.
 * 한 색으로 굳으면 배지 글자만 바뀌고 색은 그대로라, 색으로 역할을 알리는 자리가 거짓말을 한다.
 */
describe("역할 배지 색", () => {
  it("Owner · Leader · Member는 서로 다른 색이다", () => {
    const distinct = new Set([
      ROLE_BADGE_CLASS[ROLE.OWNER],
      ROLE_BADGE_CLASS[ROLE.LEADER],
      ROLE_BADGE_CLASS[ROLE.MEMBER],
    ]);

    expect(distinct.size).toBe(3);
  });

  it("모든 역할에 배지·표식 색이 있다 — 빠지면 색 없는 배지가 뜬다", () => {
    for (const role of Object.values(ROLE)) {
      expect(ROLE_BADGE_CLASS[role]).toBeTruthy();
      expect(ROLE_MARK_CLASS[role]).toBeTruthy();
      expect(ROLE_LABEL[role]).toBeTruthy();
    }
  });

  it("SYSTEM은 회색을 쓴다 — 기업 화면의 역할이 아니라 자기 색이 없다", () => {
    expect(ROLE_BADGE_CLASS[ROLE.SYSTEM]).toBe(ROLE_BADGE_CLASS[ROLE.MEMBER]);
    expect(ROLE_MARK_CLASS[ROLE.SYSTEM]).toBe(ROLE_MARK_CLASS[ROLE.MEMBER]);
  });

  /*
    ⚠️ Tailwind는 소스에 **적힌 그대로의 클래스만** 찾는다. `bg-role-${role}`처럼 이어 붙이면
       빌드에서 그 클래스가 안 만들어져 색이 통째로 빠진다 — 화면에서만 드러나는 종류의 사고라
       여기서 막는다.
  */
  it("클래스는 조각을 이어 만들지 않는다 — Tailwind가 못 찾는다", () => {
    for (const value of [...Object.values(ROLE_BADGE_CLASS), ...Object.values(ROLE_MARK_CLASS)]) {
      expect(value).not.toContain("${");
      expect(value).toMatch(/^[a-z0-9-]+(\s[a-z0-9-]+)*$/);
    }
  });
});
