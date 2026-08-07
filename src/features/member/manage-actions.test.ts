jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/mocks/config", () => ({ isMock: true }));
jest.mock("@/features/shell/viewer", () => ({ getViewer: jest.fn() }));

import { revalidatePath } from "next/cache";

import { AUTHORITY } from "@/constants/authority";
import { MEMBER_STATUS } from "@/constants/member";
import { getViewer } from "@/features/shell/viewer";

import {
  approveHandoverAction,
  changeMemberGradeAction,
  issueAccountAction,
  rejectHandoverAction,
} from "./manage-actions";
import type { AccountDraft } from "./manage-types";
import { findMockManagedMember, resetMockManagedMembers } from "./mock/managed";

/**
 * 사원 관리의 변경 작업.
 *
 * ⚠️ 여기서 보는 건 **권한이 두 겹으로 갈리는 지점**이다(WORKFLOW §11) —
 *    화면·직급 변경은 Admin도, 승인·반려는 Owner만. 한 함수로 뭉뚱그리면 아무도 못 잡는다.
 */

const revalidatePathMock = revalidatePath as unknown as jest.Mock;
const getViewerMock = getViewer as unknown as jest.Mock;

const OWNER = { id: 1, name: "박대표", role: AUTHORITY.OWNER, isAdmin: false };
const ADMIN = { id: 3, name: "이하윤", role: AUTHORITY.MEMBER, isAdmin: true };
const MEMBER = { id: 4, name: "박도현", role: AUTHORITY.MEMBER, isAdmin: false };

/** 휴직 승인을 기다리는 사람 */
const WAITING_ID = 3;

const DRAFT: AccountDraft = {
  name: "신입",
  email: "newbie@zgroup.co.kr",
  teamName: "개발팀",
  position: "사원",
  authority: AUTHORITY.MEMBER,
  isAdmin: false,
};

beforeEach(() => {
  revalidatePathMock.mockClear();
  resetMockManagedMembers();
  getViewerMock.mockResolvedValue(OWNER);
});

describe("권한 — 화면과 승인이 갈린다", () => {
  /*
    ⚠️ **Admin 겸직자는 승인·반려를 못 한다**(2026-08-06 확정). 화면에는 들어오지만
       그 안의 버튼만 Owner 것이다 — 이 구분이 무너지면 팀장급이 다른 팀장의 오프보딩을
       승인하게 된다.
  */
  it("Admin 겸직자는 직급은 바꾸지만 승인·반려는 못 한다", async () => {
    getViewerMock.mockResolvedValue(ADMIN);

    expect(
      await changeMemberGradeAction(4, {
        position: "선임",
        authority: AUTHORITY.MEMBER,
        isAdmin: false,
      }),
    ).toEqual({ isSuccess: true });

    expect(await approveHandoverAction(WAITING_ID)).toMatchObject({ isSuccess: false });
    expect(await rejectHandoverAction(WAITING_ID, "사유")).toMatchObject({ isSuccess: false });
  });

  it("일반 사원은 아무것도 못 한다", async () => {
    getViewerMock.mockResolvedValue(MEMBER);

    expect(
      await changeMemberGradeAction(4, {
        position: "선임",
        authority: AUTHORITY.MEMBER,
        isAdmin: false,
      }),
    ).toMatchObject({ isSuccess: false });
    expect(await issueAccountAction(DRAFT)).toMatchObject({ message: expect.any(String) });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("세션을 못 읽으면 거부하되 권한 없음과 다른 말을 한다", async () => {
    getViewerMock.mockRejectedValue(new Error("no session"));

    const result = await approveHandoverAction(WAITING_ID);

    expect(result.message).toMatch(/로그인/);
    expect(result.message).not.toMatch(/권한|대표만/);
  });
});

describe("changeMemberGradeAction", () => {
  /*
    ⚠️ 화면 셀렉트는 Leader·Member만 주지만 액션은 직접 부를 수 있다 — 없으면 아무나
       자기 계정을 OWNER로 올린다(§권한: 화면 숨김은 보안이 아니다).
  */
  it("OWNER 권한을 심으려 하면 막는다", async () => {
    const result = await changeMemberGradeAction(4, {
      position: "사원",
      authority: AUTHORITY.OWNER,
      isAdmin: false,
    });

    expect(result.isSuccess).toBe(false);
    expect(findMockManagedMember(4)?.member.authority).toBe(AUTHORITY.MEMBER);
  });

  it("직급이 비면 막는다", async () => {
    const result = await changeMemberGradeAction(4, {
      position: "  ",
      authority: AUTHORITY.MEMBER,
      isAdmin: false,
    });

    expect(result.isSuccess).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("저장하면 목에 남는다", async () => {
    await changeMemberGradeAction(4, {
      position: "선임",
      authority: AUTHORITY.MEMBER,
      isAdmin: true,
    });

    const after = findMockManagedMember(4)?.member;
    expect(after?.position).toBe("선임");
    expect(after?.isAdmin).toBe(true);
  });

  /*
    ⚠️ **자기 계정은 못 바꾼다.** 권한은 위에서 아래로만 흐른다 — Admin 겸직자가 자기를
       Leader로 올리면 대표가 준 적 없는 화면이 열리고, 기록상 "관리자가 승인했다"와
       구분되지 않는다.
  */
  it("자기 계정의 권한은 못 바꾼다", async () => {
    getViewerMock.mockResolvedValue(ADMIN);

    const result = await changeMemberGradeAction(ADMIN.id, {
      position: "팀장",
      authority: AUTHORITY.LEADER,
      isAdmin: true,
    });

    expect(result.isSuccess).toBe(false);
    expect(findMockManagedMember(ADMIN.id)?.member.authority).toBe(AUTHORITY.MEMBER);
  });

  /*
    ⚠️ 화면은 Owner면 폼을 안 그리지만 액션은 직접 부를 수 있다 — 막지 않으면 회사에
       하나뿐인 대표를 Member로 끌어내릴 수 있고, `OWNER`는 화이트리스트에 없어
       **되돌릴 수도 없다**(일방통행 파괴).
  */
  it("대표 계정은 못 끌어내린다", async () => {
    const result = await changeMemberGradeAction(1, {
      position: "사원",
      authority: AUTHORITY.MEMBER,
      isAdmin: false,
    });

    expect(result.isSuccess).toBe(false);
    expect(findMockManagedMember(1)?.member.authority).toBe(AUTHORITY.OWNER);
  });
});

describe("팀당 리더 한 명", () => {
  /*
    ⚠️ 리더가 둘이면 같은 팀원의 인수인계를 두 사람이 중간 승인할 수 있고, 하나뿐인 리더를
       내리면 그 팀의 중간 승인 라인이 조용히 사라진다(WORKFLOW §7).
  */
  it("이미 팀장이 있는 팀에 또 승격시키지 못한다", async () => {
    // 개발팀에는 김서준(id 2)이 이미 LEADER다
    const result = await changeMemberGradeAction(4, {
      position: "팀장",
      authority: AUTHORITY.LEADER,
      isAdmin: false,
    });

    expect(result.isSuccess).toBe(false);
    expect(result.message).toMatch(/이미 팀장/);
  });

  it("유일한 팀장을 내리지 못한다", async () => {
    const result = await changeMemberGradeAction(2, {
      position: "선임",
      authority: AUTHORITY.MEMBER,
      isAdmin: false,
    });

    expect(result.isSuccess).toBe(false);
    expect(result.message).toMatch(/후임/);
  });

  it("팀장이 없는 팀에는 승격시킬 수 있다", async () => {
    // 임지안(id 8)은 마케팅팀인데 최유진(id 5)이 팀장이다 — 먼저 팀장을 비우는 대신
    // 팀장이 없는 상황을 만들려면 다른 팀이 필요하다. 여기서는 발급으로 확인한다.
    const result = await issueAccountAction({
      ...DRAFT,
      email: "newlead@zgroup.co.kr",
      teamName: "새로운팀",
      authority: AUTHORITY.LEADER,
    });

    expect(result.issued).toBeTruthy();
  });

  it("이미 팀장이 있는 팀으로는 Leader 계정을 발급하지 못한다", async () => {
    const result = await issueAccountAction({
      ...DRAFT,
      email: "another@zgroup.co.kr",
      teamName: "개발팀",
      authority: AUTHORITY.LEADER,
    });

    expect(result.errors.authority).toBeTruthy();
    expect(result.issued).toBeUndefined();
  });
});

describe("승인 · 반려", () => {
  /*
    ⚠️ 흐름 이름과 끝난 뒤 상태가 다르다 — 휴직은 `VACATION`, 오프보딩은 `RESIGNED`다
       (§도메인 상수: 오프보딩 ↔ 퇴사).
  */
  it("휴직을 승인하면 휴직 상태가 되고 신청이 사라진다", async () => {
    expect(await approveHandoverAction(WAITING_ID)).toEqual({ isSuccess: true });

    const after = findMockManagedMember(WAITING_ID);
    expect(after?.member.status).toBe(MEMBER_STATUS.VACATION);
    expect(after?.pendingHandover).toBeNull();
  });

  it("오프보딩을 승인하면 퇴사 상태가 된다", async () => {
    await approveHandoverAction(8);

    expect(findMockManagedMember(8)?.member.status).toBe(MEMBER_STATUS.RESIGNED);
  });

  it("반려하면 재직으로 돌아가고 신청이 사라진다", async () => {
    expect(await rejectHandoverAction(WAITING_ID, "인계가 빠졌습니다")).toEqual({
      isSuccess: true,
    });

    const after = findMockManagedMember(WAITING_ID);
    expect(after?.member.status).toBe(MEMBER_STATUS.ACTIVE);
    expect(after?.pendingHandover).toBeNull();
  });

  /* ⚠️ 사유 없이 되돌리면 신청한 사람은 무엇을 고쳐 다시 낼지 알 수 없다 */
  it("사유 없는 반려는 막는다", async () => {
    expect(await rejectHandoverAction(WAITING_ID, "   ")).toMatchObject({ isSuccess: false });
    expect(findMockManagedMember(WAITING_ID)?.pendingHandover).not.toBeNull();
  });

  /* ⚠️ 화면이 보낸 id만 믿으면 이미 처리된 건을 두 번 승인한다 */
  it("기다리는 신청이 없으면 막는다", async () => {
    expect(await approveHandoverAction(4)).toMatchObject({ isSuccess: false });
    expect(await rejectHandoverAction(4, "사유")).toMatchObject({ isSuccess: false });
  });
});

describe("issueAccountAction", () => {
  it("발급하면 목록에 붙고 목록 경로를 다시 읽는다", async () => {
    const result = await issueAccountAction(DRAFT);

    expect(result.issued?.name).toBe("신입");
    expect(findMockManagedMember(result.issued!.id)?.member.email).toBe(DRAFT.email);
    expect(revalidatePathMock).toHaveBeenCalledWith("/manage/members");
  });

  /* ⚠️ 같은 메일에 두 계정이 붙으면 첫 비밀번호가 어디로 갈지 알 수 없다 */
  it("이미 쓰는 메일은 칸 오류로 돌려준다", async () => {
    const result = await issueAccountAction({ ...DRAFT, email: "hayun@zgroup.co.kr" });

    expect(result.errors.email).toBeTruthy();
    expect(result.issued).toBeUndefined();
  });

  it("검증에 걸리면 발급도 재검증도 없다", async () => {
    const result = await issueAccountAction({ ...DRAFT, name: "" });

    expect(result.errors.name).toBeTruthy();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  /* ⚠️ 역할은 발급 때 안 정한다 — 팀에 들어간 뒤 팀장이 붙이는 라벨이다(WORKFLOW §9) */
  it("새 계정은 역할 없이 재직으로 들어간다", async () => {
    const result = await issueAccountAction(DRAFT);
    const created = findMockManagedMember(result.issued!.id)?.member;

    expect(created?.roleLabel).toBeNull();
    expect(created?.status).toBe(MEMBER_STATUS.ACTIVE);
    expect(created?.isAdmin).toBe(false);
  });
});

/*
  ⚠️ 발급 창에 관리자 겸직 토글을 붙였다(온보딩 초대 줄과 같은 자리). 켜서 내면 그 값이
     실제로 계정에 붙어야 한다 — 화면만 켜지고 발급이 무시하면 아무도 모르게 어긋난다.
*/
describe("계정 발급 — 관리자 겸직", () => {
  it("겸직을 켜서 내면 그 계정이 겸직으로 만들어진다", async () => {
    const result = await issueAccountAction({
      ...DRAFT,
      name: "겸직",
      email: "admin-new@company.com",
      isAdmin: true,
    });

    expect(result.issued).toBeDefined();
    expect(findMockManagedMember(result.issued!.id)?.member.isAdmin).toBe(true);
  });

  it("안 켜면 겸직이 아니다 — 기본은 꺼짐이다", async () => {
    const result = await issueAccountAction({
      ...DRAFT,
      name: "일반",
      email: "plain-new@company.com",
      isAdmin: false,
    });

    expect(findMockManagedMember(result.issued!.id)?.member.isAdmin).toBe(false);
  });
});
