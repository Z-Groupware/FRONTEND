import {
  departmentsWithLeader,
  duplicatedLeaderIds,
  duplicateEmails,
  type InviteRules,
  isValidEmail,
} from "./invite-rules";
import {
  changeInviteDepartment,
  changeInviteEmail,
  changeInvitePosition,
  changeInviteRole,
  createInvite,
  markInvitesSent,
  removeInvite,
  sendableInvites,
  toggleInviteAdmin,
} from "./invites";
import type { Invite } from "./types";
import { NO_ROLE_ID } from "./types";

/** 목록에서 `lead`만 리더 직급으로 보고, 모든 부서에 역할이 있다고 본다 */
const isLeader: InviteRules = {
  isLeaderPosition: (positionId) => positionId === "lead",
  hasRoles: () => true,
};

const makeList = (): Invite[] => [
  {
    id: "a",
    name: "",
    email: "dev1@company.com",
    departmentId: "dev",
    roleId: NO_ROLE_ID,
    positionId: "staff",
    isAdmin: false,
    isSent: false,
  },
  {
    id: "b",
    name: "",
    email: "design@company.com",
    departmentId: "design",
    roleId: NO_ROLE_ID,
    positionId: "staff",
    isAdmin: false,
    isSent: false,
  },
  {
    id: "c",
    name: "",
    email: "",
    departmentId: "dev",
    roleId: NO_ROLE_ID,
    positionId: "staff",
    isAdmin: false,
    isSent: false,
  },
];

const emails = (invites: Invite[]) => invites.map((invite) => invite.email);

describe("createInvite", () => {
  it("부서·역할·직급까지 **전부 빈 채로** 만든다 — 고르지 않은 값이 채워져 있으면 안 된다", () => {
    expect(createInvite("invite-1")).toEqual({
      id: "invite-1",
      name: "",
      email: "",
      departmentId: "",
      // ⚠️ `NO_ROLE_ID`가 아니다 — 그건 `없음`을 **고른** 상태다. 새 줄은 아직 안 골랐다.
      roleId: "",
      positionId: "",
      isAdmin: false,
      isSent: false,
    });
  });
});

describe("isValidEmail", () => {
  it.each(["a@b.co", " dev1@company.com "])("올바른 주소를 통과시킨다: %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(["", "  ", "dev1", "dev1@", "@company.com", "dev1@company", "dev 1@company.com"])(
    "형식이 어긋나면 막는다: %s",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );
});

describe("changeInvite*", () => {
  it("주소를 바꾼다", () => {
    expect(emails(changeInviteEmail(makeList(), "c", "biz@company.com"))).toEqual([
      "dev1@company.com",
      "design@company.com",
      "biz@company.com",
    ]);
  });

  it("부서를 바꾼다", () => {
    const next = changeInviteDepartment(makeList(), "a", "biz", isLeader);
    expect(next[0]?.departmentId).toBe("biz");
  });

  it("직급을 바꾼다", () => {
    const next = changeInvitePosition(makeList(), "a", "staff", isLeader);
    expect(next[0]?.positionId).toBe("staff");
  });

  /*
    리더는 부서 전체를 맡는 자리다 — 부서 안의 한 역할에 매이면 관리 범위가 어긋난다.
    화면에서 막는 것만으로는 부족하다: 역할을 먼저 고른 뒤 직급을 리더로 바꾸는 순서가 남는다.
  */
  it("리더 직급을 고르면 역할이 함께 비워진다", () => {
    const next = changeInvitePosition(makeList(), "a", "lead", isLeader);
    expect(next[0]?.positionId).toBe("lead");
    expect(next[0]?.roleId).toBe(NO_ROLE_ID);
  });

  it("리더가 아닌 직급은 역할을 건드리지 않는다", () => {
    const before = makeList()[0]?.roleId;
    expect(changeInvitePosition(makeList(), "a", "staff", isLeader)[0]?.roleId).toBe(before);
  });

  it("원본을 바꾸지 않는다", () => {
    const invites = makeList();
    changeInviteEmail(invites, "a", "other@company.com");
    expect(invites[0]?.email).toBe("dev1@company.com");
  });
});

describe("removeInvite", () => {
  it("해당 줄만 지운다", () => {
    expect(emails(removeInvite(makeList(), "a"))).toEqual(["design@company.com", ""]);
  });

  it("없는 id면 그대로 둔다", () => {
    expect(removeInvite(makeList(), "없음")).toHaveLength(3);
  });
});

describe("sendableInvites", () => {
  it("주소가 유효한 줄만 남긴다 — 빈 줄은 발송 대상이 아니다", () => {
    expect(emails(sendableInvites(makeList()))).toEqual(["dev1@company.com", "design@company.com"]);
  });
});

describe("markInvitesSent", () => {
  it("발송하면 주소가 유효한 줄에만 도장이 찍힌다 — 빈 줄은 그대로다", () => {
    const next = markInvitesSent(makeList());
    expect(next.map((invite) => invite.isSent)).toEqual([true, true, false]);
  });

  it("이미 보낸 줄은 다음 발송 대상에서 빠진다", () => {
    const sent = markInvitesSent(makeList());
    expect(sendableInvites(sent)).toEqual([]);
  });

  it("나중에 추가한 줄만 다음 발송 대상이 된다", () => {
    const sent = markInvitesSent(makeList());
    const added: Invite[] = [
      ...sent,
      {
        id: "d",
        name: "",
        email: "new@company.com",
        departmentId: "dev",
        roleId: NO_ROLE_ID,
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
    ];
    expect(emails(sendableInvites(added))).toEqual(["new@company.com"]);
  });
});

describe("duplicateEmails", () => {
  it("대소문자·공백을 무시하고 중복을 찾는다", () => {
    const invites: Invite[] = [
      {
        id: "a",
        name: "",
        email: "dev1@company.com",
        departmentId: "dev",
        roleId: NO_ROLE_ID,
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
      {
        id: "b",
        name: "",
        email: " DEV1@Company.com ",
        departmentId: "design",
        roleId: NO_ROLE_ID,
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
      {
        id: "c",
        name: "",
        email: "biz@company.com",
        departmentId: "biz",
        roleId: NO_ROLE_ID,
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
    ];
    expect(duplicateEmails(invites)).toEqual(new Set(["dev1@company.com"]));
  });

  it("빈 줄은 중복으로 세지 않는다", () => {
    const invites: Invite[] = [
      {
        id: "a",
        name: "",
        email: "",
        departmentId: "dev",
        roleId: NO_ROLE_ID,
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
      {
        id: "b",
        name: "",
        email: "  ",
        departmentId: "dev",
        roleId: NO_ROLE_ID,
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
    ];
    expect(duplicateEmails(invites).size).toBe(0);
  });
});

/*
  역할이 하나도 없는 부서는 규칙에서 빠진다 — 고를 역할이 `없음`뿐이라
  그대로 적용하면 그 부서에 팀장 한 명밖에 못 들어간다(팀 결정: 예외 허용).
*/
describe("역할 없는 부서 — 짝 규칙에서 빠진다", () => {
  const noRoles: InviteRules = { isLeaderPosition: (id) => id === "lead", hasRoles: () => false };

  it("역할이 `없음`이어도 일반 직급을 그대로 둔다", () => {
    const next = changeInviteRole(makeList(), "a", NO_ROLE_ID, noRoles);
    expect(next[0]?.roleId).toBe(NO_ROLE_ID);
    expect(next[0]?.positionId).toBe("staff");
  });

  it("역할이 있는 부서라면 같은 조작에서 직급이 비워진다 — 예외인지 아닌지가 갈린다", () => {
    const next = changeInviteRole(makeList(), "a", NO_ROLE_ID, isLeader);
    expect(next[0]?.positionId).toBe("");
  });
});

describe("changeInviteRole", () => {
  it("역할만 바꾼다", () => {
    const next = changeInviteRole(makeList(), "a", "fe", isLeader);
    expect(next[0]?.roleId).toBe("fe");
    expect(next[0]?.departmentId).toBe("dev");
  });

  /*
    역할과 직급은 짝이 맞아야 한다: 리더는 `없음`, 나머지는 역할이 있어야 한다.
    ⚠️ 어긋나면 **직급을 비운다.** 막기만 하면 어느 쪽도 못 고치는 줄이 생긴다.
  */
  it("리더가 아닌 직급인데 역할을 `없음`으로 바꾸면 직급이 비워진다", () => {
    const staff = changeInviteRole(makeList(), "a", "fe", isLeader);
    const next = changeInviteRole(staff, "a", NO_ROLE_ID, isLeader);
    expect(next[0]?.roleId).toBe(NO_ROLE_ID);
    expect(next[0]?.positionId).toBe("");
  });

  it("리더 직급인데 역할을 고르면 직급이 비워진다", () => {
    const leader = changeInvitePosition(makeList(), "a", "lead", isLeader);
    const next = changeInviteRole(leader, "a", "fe", isLeader);
    expect(next[0]?.roleId).toBe("fe");
    expect(next[0]?.positionId).toBe("");
  });

  it("짝이 맞으면 직급은 그대로다", () => {
    const next = changeInviteRole(makeList(), "a", "fe", isLeader);
    expect(next[0]?.positionId).toBe("staff");
  });
});

describe("changeInviteDepartment — 역할 초기화", () => {
  it("부서를 바꾸면 역할은 비운다 — 다른 부서의 역할이 남으면 안 된다", () => {
    const assigned = changeInviteRole(makeList(), "a", "fe", isLeader);
    const moved = changeInviteDepartment(assigned, "a", "design", isLeader);
    expect(moved[0]?.departmentId).toBe("design");
    expect(moved[0]?.roleId).toBe("");
  });
});

describe("departmentsWithLeader / duplicatedLeaderIds — 부서마다 리더 한 명", () => {
  const isLeader = (positionId: string) => positionId === "lead";
  const row = (id: string, departmentId: string, positionId: string): Invite => ({
    id,
    name: "",
    email: `${id}@company.com`,
    departmentId,
    roleId: NO_ROLE_ID,
    positionId,
    isAdmin: false,
    isSent: false,
  });

  /*
    ⚠️ 주소를 안 적었어도 리더 자리는 **차지한다**(2026-08-04 변경).
       전에는 빼고 셌는데, 그러면 리더로 골라 둔 줄을 여러 개 만든 뒤 주소만 채우는 순서로
       한 부서에 리더가 여럿 남았다. 직급은 부서·역할을 고른 뒤에야 열리므로,
       리더로 고른 줄은 주소가 없어도 작정한 줄이다.
  */
  it("주소가 비어도 리더 자리를 차지한다", () => {
    const empty: Invite = {
      id: "a",
      name: "",
      email: "",
      departmentId: "dev",
      roleId: NO_ROLE_ID,
      positionId: "lead",
      isAdmin: false,
      isSent: false,
    };
    expect(departmentsWithLeader([empty], isLeader)).toEqual(new Set(["dev"]));
    expect(duplicatedLeaderIds([empty, { ...empty, id: "b" }], isLeader)).toEqual(new Set(["b"]));
  });

  it("리더가 있는 부서를 알려준다", () => {
    const invites = [row("a", "dev", "lead"), row("b", "design", "staff")];
    expect(departmentsWithLeader(invites, isLeader)).toEqual(new Set(["dev"]));
  });

  it("자기 줄은 빼고 센다 — 자기가 리더인 줄에서 다시 리더를 고를 수 있어야 한다", () => {
    const invites = [row("a", "dev", "lead")];
    expect(departmentsWithLeader(invites, isLeader, "a").size).toBe(0);
  });

  it("부서가 다르면 리더가 둘이어도 괜찮다", () => {
    const invites = [row("a", "dev", "lead"), row("b", "design", "lead")];
    expect(duplicatedLeaderIds(invites, isLeader).size).toBe(0);
  });

  it("같은 부서에 리더가 둘이면 뒷줄을 잡는다", () => {
    const invites = [row("a", "dev", "lead"), row("b", "dev", "lead")];
    expect(duplicatedLeaderIds(invites, isLeader)).toEqual(new Set(["b"]));
  });
});

describe("이미 발송한 줄은 고칠 수 없다", () => {
  const sent: Invite[] = [
    {
      id: "a",
      name: "",
      email: "dev1@company.com",
      departmentId: "dev",
      roleId: "fe",
      positionId: "staff",
      isAdmin: false,
      isSent: true,
    },
  ];

  it("메일 주소를 바꾸려 해도 그대로다", () => {
    expect(changeInviteEmail(sent, "a", "other@company.com")[0]?.email).toBe("dev1@company.com");
  });

  it("부서를 바꾸려 해도 그대로다 — 역할도 지워지지 않는다", () => {
    const next = changeInviteDepartment(sent, "a", "design", isLeader)[0];
    expect(next?.departmentId).toBe("dev");
    expect(next?.roleId).toBe("fe");
  });

  it("역할·직급도 그대로다", () => {
    expect(changeInviteRole(sent, "a", "be", isLeader)[0]?.roleId).toBe("fe");
    expect(changeInvitePosition(sent, "a", "lead", isLeader)[0]?.positionId).toBe("staff");
  });
});

describe("같은 주소는 한 번만 나간다", () => {
  const twice: Invite[] = [
    {
      id: "a",
      name: "",
      email: "dev1@company.com",
      departmentId: "dev",
      roleId: NO_ROLE_ID,
      positionId: "staff",
      isAdmin: false,
      isSent: false,
    },
    {
      id: "b",
      name: "",
      email: "DEV1@company.com",
      departmentId: "design",
      roleId: NO_ROLE_ID,
      positionId: "staff",
      isAdmin: false,
      isSent: false,
    },
  ];

  it("중복 주소는 첫 줄만 발송 대상이다", () => {
    expect(sendableInvites(twice).map((invite) => invite.id)).toEqual(["a"]);
  });

  it("발송해도 둘째 줄은 잠기지 않는다 — 아직 안 나갔으니까", () => {
    const next = markInvitesSent(twice);
    expect(next[0]?.isSent).toBe(true);
    expect(next[1]?.isSent).toBe(false);
  });

  it("이미 나간 주소를 새 줄에 다시 적어도 나가지 않는다", () => {
    const again: Invite[] = [
      { ...twice[0]!, isSent: true },
      { ...twice[1]!, id: "c" },
    ];
    expect(sendableInvites(again)).toHaveLength(0);
  });
});

describe("Admin 겸직 토글", () => {
  const make = (isAdmin: boolean, isSent: boolean): Invite[] => [
    {
      id: "a",
      name: "",
      email: "a@company.com",
      departmentId: "dev",
      roleId: NO_ROLE_ID,
      positionId: "staff",
      isAdmin,
      isSent,
    },
  ];

  it("켜고 끌 수 있다", () => {
    expect(toggleInviteAdmin(make(false, false), "a")[0]?.isAdmin).toBe(true);
    expect(toggleInviteAdmin(make(true, false), "a")[0]?.isAdmin).toBe(false);
  });

  it("이미 나간 초대장은 못 바꾼다", () => {
    expect(toggleInviteAdmin(make(false, true), "a")[0]?.isAdmin).toBe(false);
  });

  it("역할·직급은 건드리지 않는다 — 겸직은 그 위에 얹히는 것이다", () => {
    const [next] = toggleInviteAdmin(make(false, false), "a");

    expect(next?.positionId).toBe("staff");
    expect(next?.roleId).toBe(NO_ROLE_ID);
  });
});
