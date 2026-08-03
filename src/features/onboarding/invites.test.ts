import {
  changeInviteDepartment,
  changeInviteEmail,
  changeInvitePosition,
  changeInviteRole,
  createInvite,
  departmentsWithLeader,
  duplicatedLeaderIds,
  duplicateEmails,
  isValidEmail,
  markInvitesSent,
  removeInvite,
  sendableInvites,
  sentInvites,
  toggleInviteAdmin,
} from "./invites";
import type { Invite } from "./types";

const makeList = (): Invite[] => [
  {
    id: "a",
    email: "dev1@company.com",
    departmentId: "dev",
    roleId: "",
    positionId: "staff",
    isAdmin: false,
    isSent: false,
  },
  {
    id: "b",
    email: "design@company.com",
    departmentId: "design",
    roleId: "",
    positionId: "staff",
    isAdmin: false,
    isSent: false,
  },
  {
    id: "c",
    email: "",
    departmentId: "dev",
    roleId: "",
    positionId: "staff",
    isAdmin: false,
    isSent: false,
  },
];

const emails = (invites: Invite[]) => invites.map((invite) => invite.email);

describe("createInvite", () => {
  it("빈 주소와 지정한 부서·직급으로 만든다", () => {
    expect(createInvite("invite-1", "dev", "staff")).toEqual({
      id: "invite-1",
      email: "",
      departmentId: "dev",
      roleId: "",
      positionId: "staff",
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
    const next = changeInviteDepartment(makeList(), "a", "biz");
    expect(next[0]?.departmentId).toBe("biz");
  });

  it("직급을 바꾼다", () => {
    const next = changeInvitePosition(makeList(), "a", "lead");
    expect(next[0]?.positionId).toBe("lead");
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

describe("sentInvites · markInvitesSent", () => {
  it("발송하면 주소가 유효한 줄에만 도장이 찍힌다 — 빈 줄은 그대로다", () => {
    const next = markInvitesSent(makeList());
    expect(next.map((invite) => invite.isSent)).toEqual([true, true, false]);
  });

  it("이미 보낸 줄은 다음 발송 대상에서 빠진다", () => {
    const sent = markInvitesSent(makeList());
    expect(sendableInvites(sent)).toEqual([]);
    expect(emails(sentInvites(sent))).toEqual(["dev1@company.com", "design@company.com"]);
  });

  it("나중에 추가한 줄만 다음 발송 대상이 된다", () => {
    const sent = markInvitesSent(makeList());
    const added: Invite[] = [
      ...sent,
      {
        id: "d",
        email: "new@company.com",
        departmentId: "dev",
        roleId: "",
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
        email: "dev1@company.com",
        departmentId: "dev",
        roleId: "",
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
      {
        id: "b",
        email: " DEV1@Company.com ",
        departmentId: "design",
        roleId: "",
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
      {
        id: "c",
        email: "biz@company.com",
        departmentId: "biz",
        roleId: "",
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
        email: "",
        departmentId: "dev",
        roleId: "",
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
      {
        id: "b",
        email: "  ",
        departmentId: "dev",
        roleId: "",
        positionId: "staff",
        isAdmin: false,
        isSent: false,
      },
    ];
    expect(duplicateEmails(invites).size).toBe(0);
  });
});

describe("changeInviteRole", () => {
  it("역할만 바꾼다", () => {
    const next = changeInviteRole(makeList(), "a", "fe");
    expect(next[0]?.roleId).toBe("fe");
    expect(next[0]?.departmentId).toBe("dev");
  });

  it('빈 문자열이면 "없음"이다 — 부서에 바로 속한다', () => {
    const assigned = changeInviteRole(makeList(), "a", "fe");
    expect(changeInviteRole(assigned, "a", "")[0]?.roleId).toBe("");
  });
});

describe("changeInviteDepartment — 역할 초기화", () => {
  it("부서를 바꾸면 역할은 비운다 — 다른 부서의 역할이 남으면 안 된다", () => {
    const assigned = changeInviteRole(makeList(), "a", "fe");
    const moved = changeInviteDepartment(assigned, "a", "design");
    expect(moved[0]?.departmentId).toBe("design");
    expect(moved[0]?.roleId).toBe("");
  });
});

describe("departmentsWithLeader / duplicatedLeaderIds — 부서마다 리더 한 명", () => {
  const isLeader = (positionId: string) => positionId === "lead";
  const row = (id: string, departmentId: string, positionId: string): Invite => ({
    id,
    email: `${id}@company.com`,
    departmentId,
    roleId: "",
    positionId,
    isAdmin: false,
    isSent: false,
  });

  it("주소가 빈 줄은 리더 자리를 차지하지 않는다 — 아직 초대가 아니다", () => {
    const empty: Invite = {
      id: "a",
      email: "",
      departmentId: "dev",
      roleId: "",
      positionId: "lead",
      isAdmin: false,
      isSent: false,
    };
    expect(departmentsWithLeader([empty], isLeader).size).toBe(0);
    expect(duplicatedLeaderIds([empty, { ...empty, id: "b" }], isLeader).size).toBe(0);
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
    const next = changeInviteDepartment(sent, "a", "design")[0];
    expect(next?.departmentId).toBe("dev");
    expect(next?.roleId).toBe("fe");
  });

  it("역할·직급도 그대로다", () => {
    expect(changeInviteRole(sent, "a", "be")[0]?.roleId).toBe("fe");
    expect(changeInvitePosition(sent, "a", "lead")[0]?.positionId).toBe("staff");
  });
});

describe("같은 주소는 한 번만 나간다", () => {
  const twice: Invite[] = [
    {
      id: "a",
      email: "dev1@company.com",
      departmentId: "dev",
      roleId: "",
      positionId: "staff",
      isAdmin: false,
      isSent: false,
    },
    {
      id: "b",
      email: "DEV1@company.com",
      departmentId: "design",
      roleId: "",
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
      email: "a@company.com",
      departmentId: "dev",
      roleId: "",
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
    expect(next?.roleId).toBe("");
  });
});
