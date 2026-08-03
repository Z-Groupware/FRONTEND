import { ROLE } from "@/constants/domain";

import {
  type Actor,
  canApproveFinal,
  canGrantAdmin,
  canIssueAccount,
  canManageBilling,
  canManageMembers,
  canManageRooms,
  canViewBilling,
} from "./permission";

/**
 * 권한 개편(Admin = 겸직) 회귀 테스트.
 *
 * ⚠️ 여기서 지키려는 건 하나다 — **Admin은 역할 위에 얹히고, Owner에게는 얹히지 않는다.**
 *    BE가 실수로 Owner에게 `isAdmin: true`를 내려도 권한이 새면 안 된다.
 */
const leader: Actor = { id: 1, role: ROLE.LEADER };
const member: Actor = { id: 2, role: ROLE.MEMBER };
const owner: Actor = { id: 3, role: ROLE.OWNER };

describe("Admin 겸직", () => {
  it("Leader가 Admin을 겸하면 운영 권한이 열린다", () => {
    const concurrent: Actor = { ...leader, isAdmin: true };

    expect(canIssueAccount(concurrent)).toBe(true);
    expect(canManageRooms(concurrent)).toBe(true);
    expect(canManageMembers(concurrent)).toBe(true);
  });

  it("겸직하지 않은 Leader는 운영 권한이 없다", () => {
    expect(canIssueAccount(leader)).toBe(false);
    expect(canManageRooms(leader)).toBe(false);
    expect(canManageMembers(leader)).toBe(false);
  });

  it("Owner에게 isAdmin이 잘못 켜져 와도 Admin 권한이 새지 않는다", () => {
    const spoofed: Actor = { ...owner, isAdmin: true };

    expect(canIssueAccount(spoofed)).toBe(false);
    expect(canManageRooms(spoofed)).toBe(false);
  });

  it("겸직 대상은 Leader·Member뿐이다", () => {
    expect(canGrantAdmin(leader)).toBe(true);
    expect(canGrantAdmin(member)).toBe(true);
    expect(canGrantAdmin(owner)).toBe(false);
  });
});

describe("Owner와 Admin이 갈리는 지점", () => {
  it("계정 발급은 Admin만 — Owner는 못 한다", () => {
    expect(canIssueAccount(owner)).toBe(false);
  });

  it("구독 결제는 Owner만 실행하고, Admin은 보기까지다", () => {
    const concurrent: Actor = { ...member, isAdmin: true };

    expect(canManageBilling(owner)).toBe(true);
    expect(canManageBilling(concurrent)).toBe(false);
    expect(canViewBilling(concurrent)).toBe(true);
  });

  it("인수인계 최종 승인은 Owner와 Admin 둘 다 된다", () => {
    expect(canApproveFinal(owner)).toBe(true);
    expect(canApproveFinal({ ...member, isAdmin: true })).toBe(true);
    expect(canApproveFinal(member)).toBe(false);
  });
});
