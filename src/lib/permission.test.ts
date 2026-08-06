import { ROLE } from "@/constants/domain";

import {
  type Actor,
  canApproveFinal,
  canGrantAdmin,
  canIssueAccount,
  canManageBilling,
  canManageMembers,
  canManageNotice,
  canManageRooms,
  canViewMeetingDetail,
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

  it("겸직 대상은 Leader·Member뿐이다", () => {
    expect(canGrantAdmin(leader)).toBe(true);
    expect(canGrantAdmin(member)).toBe(true);
    expect(canGrantAdmin(owner)).toBe(false);
  });
});

describe("Owner와 Admin이 갈리는 지점", () => {
  it("계정 발급은 Owner와 Admin 겸직자가 함께 한다(2026-08-06: 사원 관리 화면 통합)", () => {
    const concurrent: Actor = { ...member, isAdmin: true };

    expect(canIssueAccount(owner)).toBe(true);
    expect(canIssueAccount(concurrent)).toBe(true);
    expect(canIssueAccount(member)).toBe(false);
  });

  it("구독 결제는 Owner와 Admin 겸직자가 함께 맡는다", () => {
    const concurrent: Actor = { ...member, isAdmin: true };

    expect(canManageBilling(owner)).toBe(true);
    expect(canManageBilling(concurrent)).toBe(true);
    expect(canManageBilling(member)).toBe(false);
  });

  it("인수인계 최종 승인은 Owner 전용이다(2026-08-06: Admin 제외)", () => {
    expect(canApproveFinal(owner)).toBe(true);
    expect(canApproveFinal({ ...member, isAdmin: true })).toBe(false);
    expect(canApproveFinal(member)).toBe(false);
  });

  it("공지 작성·수정은 Owner 전용이다(2026-08-06: Admin 제외)", () => {
    expect(canManageNotice(owner)).toBe(true);
    expect(canManageNotice({ ...member, isAdmin: true })).toBe(false);
    expect(canManageNotice(member)).toBe(false);
  });
});

describe("canViewMeetingDetail — 목록이 아니라 상세(내용) 열람", () => {
  const ownerHosted = { isOwnerHosted: true, attendeeIds: [] as number[] };
  const teamMeeting = { isOwnerHosted: false, attendeeIds: [] as number[], hostDepartmentId: 10 };

  it("Owner는 전체 열람 가능", () => {
    expect(canViewMeetingDetail(owner, teamMeeting)).toBe(true);
    expect(canViewMeetingDetail(owner, ownerHosted)).toBe(true);
  });

  it("Member는 참석자인 회의만 — 참석자 아니면 Owner 개설 회의도 못 본다", () => {
    const attendee: Actor = { id: 99, role: ROLE.MEMBER };
    expect(canViewMeetingDetail(attendee, { ...teamMeeting, attendeeIds: [99] })).toBe(true);
    expect(canViewMeetingDetail(member, teamMeeting)).toBe(false);
    expect(canViewMeetingDetail(member, ownerHosted)).toBe(false);
  });

  it("Leader는 참석자가 아니어도 Owner 개설 회의는 본다", () => {
    expect(canViewMeetingDetail(leader, ownerHosted)).toBe(true);
  });

  it("Leader는 자기 부서가 연 회의는 보고, 타 부서 회의는 못 본다", () => {
    const withDept: Actor = { ...leader, departmentId: 10 };
    expect(canViewMeetingDetail(withDept, teamMeeting)).toBe(true);
    expect(canViewMeetingDetail(withDept, { ...teamMeeting, hostDepartmentId: 20 })).toBe(false);
  });
});
