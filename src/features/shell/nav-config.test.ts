import { ROLE } from "@/constants/role";
import type { Actor } from "@/lib/permission";

import { roleHome } from "./home";
import { dashboardFor, navFor } from "./nav-config";

/**
 * 사이드바 구성 — **Admin이 역할을 갈아치우지 않는지**가 핵심이다.
 * 겸직자가 자기 대시보드나 팀 관리를 잃으면 그게 이 파일에서 가장 크게 터지는 실수다.
 */

const actor = (role: Actor["role"], isAdmin = false): Actor => ({ id: 1, role, isAdmin });

const titles = (sections: ReturnType<typeof navFor>) => sections.map((s) => s.title ?? "(기본)");
const labels = (sections: ReturnType<typeof navFor>, title: string) =>
  sections.find((s) => s.title === title)?.items.map((i) => i.label) ?? [];
const allHrefs = (sections: ReturnType<typeof navFor>) =>
  sections.flatMap((s) => s.items.map((i) => i.href));

describe("대시보드", () => {
  it.each([
    [ROLE.OWNER, "/owner"],
    [ROLE.LEADER, "/team"],
    [ROLE.MEMBER, "/my"],
  ])("%s의 첫 항목은 자기 대시보드다", (role, href) => {
    expect(navFor(actor(role))[0]?.items[0]?.href).toBe(href);
  });
});

describe("Owner", () => {
  it("회사 운영을 늘 본다 — `is_admin` 없이도", () => {
    expect(titles(navFor(actor(ROLE.OWNER)))).toContain("회사 운영");
  });

  it("**계정 발급이 없다** — 발급은 Admin의 일이고 Owner는 발급자도 대상도 아니다", () => {
    expect(labels(navFor(actor(ROLE.OWNER)), "회사 운영")).not.toContain("계정 발급");
  });

  it("기업 설정·팀장 인수인계는 Owner만 본다", () => {
    const items = labels(navFor(actor(ROLE.OWNER)), "회사 운영");
    expect(items).toContain("기업 설정");
    expect(items).toContain("팀장 인수인계");
  });

  it("내 액션·인수인계가 **없다** — 액션을 받는 자리가 아니고 인수인계를 쓰는 쪽도 아니다", () => {
    const hrefs = allHrefs(navFor(actor(ROLE.OWNER)));
    expect(hrefs).not.toContain("/app/my/actions");
    expect(hrefs).not.toContain("/app/handover");
  });

  it("팀 관리는 없다 — 부서 스코프는 팀장의 것이다", () => {
    expect(titles(navFor(actor(ROLE.OWNER)))).not.toContain("팀 관리");
  });
});

describe("Leader", () => {
  it("팀 관리가 붙는다", () => {
    expect(labels(navFor(actor(ROLE.LEADER)), "팀 관리")).toEqual([
      "팀원",
      "팀 액션",
      "인수인계 승인",
    ]);
  });

  it("겸직이 아니면 회사 운영은 없다", () => {
    expect(titles(navFor(actor(ROLE.LEADER)))).not.toContain("회사 운영");
  });

  it("내 액션·인수인계를 본다 — Owner와 갈리는 지점이다", () => {
    const hrefs = allHrefs(navFor(actor(ROLE.LEADER)));
    expect(hrefs).toContain("/app/my/actions");
    expect(hrefs).toContain("/app/handover");
  });
});

describe("Member", () => {
  it("워크벤치만 본다 — 팀 관리도 회사 운영도 없다", () => {
    expect(titles(navFor(actor(ROLE.MEMBER)))).toEqual(["(기본)", "워크벤치"]);
  });
});

describe("Admin 겸직", () => {
  /*
    ⚠️ 여기가 이 파일의 핵심이다. Admin은 **역할이 아니라 덧붙는 권한**이라(WORKFLOW §9),
       겸직해도 원래 역할의 구역이 그대로 남아야 한다.
  */
  it("팀장이 겸직해도 **팀 관리를 잃지 않는다**", () => {
    const sections = navFor(actor(ROLE.LEADER, true));
    expect(titles(sections)).toEqual(["(기본)", "워크벤치", "팀 관리", "회사 운영"]);
  });

  it("사원이 겸직하면 워크벤치는 그대로 두고 회사 운영만 붙는다", () => {
    expect(titles(navFor(actor(ROLE.MEMBER, true)))).toEqual(["(기본)", "워크벤치", "회사 운영"]);
  });

  it("겸직자는 대시보드가 **그대로다** — 관리 화면으로 첫 화면이 바뀌지 않는다", () => {
    expect(navFor(actor(ROLE.LEADER, true))[0]?.items[0]?.href).toBe("/team");
  });

  it("겸직자는 **계정 발급을 본다**", () => {
    expect(labels(navFor(actor(ROLE.MEMBER, true)), "회사 운영")).toContain("계정 발급");
  });

  it("겸직자에게 기업 설정·팀장 인수인계는 **안 보인다** — 위계상 Owner의 것이다", () => {
    const items = labels(navFor(actor(ROLE.MEMBER, true)), "회사 운영");
    expect(items).not.toContain("기업 설정");
    expect(items).not.toContain("팀장 인수인계");
  });

  it("Owner에게 `isAdmin`이 잘못 켜져도 계정 발급이 생기지 않는다", () => {
    // ⚠️ `canGrantAdmin`이 Owner를 겸직 대상에서 빼므로 판정 자체가 거짓이다
    expect(labels(navFor(actor(ROLE.OWNER, true)), "회사 운영")).not.toContain("계정 발급");
  });
});

/**
 * 로고가 데려갈 곳 — **메뉴 [대시보드]와 한 항목**이어야 한다.
 * 둘이 갈라지면 메뉴는 "준비 중"이라 말하는데 로고만 404로 데려간다.
 */
describe("dashboardFor", () => {
  it.each([
    [ROLE.OWNER, "/owner"],
    [ROLE.LEADER, "/team"],
    [ROLE.MEMBER, "/my"],
    [ROLE.SYSTEM, "/system"],
  ])("%s의 로고는 자기 대시보드로 간다 — 랜딩이 아니다", (role, href) => {
    expect(dashboardFor(role).href).toBe(href);
    expect(dashboardFor(role).href).not.toBe("/");
  });

  it("사이드바 첫 항목과 **같은 객체**다 — 갈라지면 한쪽만 준비 상태를 본다", () => {
    for (const role of [ROLE.OWNER, ROLE.LEADER, ROLE.MEMBER] as const) {
      expect(navFor(actor(role))[0]?.items[0]).toBe(dashboardFor(role));
    }
  });

  it("겸직해도 로고는 그대로다 — Admin은 첫 화면을 바꾸지 않는다", () => {
    expect(dashboardFor(actor(ROLE.LEADER, true).role).href).toBe("/team");
  });
});

/**
 * 로그인 뒤 데려다 놓는 곳(`roleHome`)과 로고가 가리키는 곳(`dashboardFor`)은
 * **같아야 한다.** 갈라지면 로그인 직후 떨어진 화면과 로고가 데려가는 화면이 달라진다 —
 * 둘 다 "첫 화면"이라고 말하면서 서로 다른 곳을 가리킨다.
 */
describe("첫 화면은 한 곳이다", () => {
  it.each([ROLE.OWNER, ROLE.LEADER, ROLE.MEMBER, ROLE.SYSTEM])(
    "%s의 roleHome과 로고 목적지가 같다",
    (role) => {
      expect(dashboardFor(role).href).toBe(roleHome(role));
    },
  );
});
