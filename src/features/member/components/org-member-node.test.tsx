import { render } from "@testing-library/react";

import { AUTHORITY } from "@/constants/authority";
import { MEMBER_STATUS } from "@/constants/member";

import type { OrgMember } from "../org-types";
import { OrgMemberNode } from "./org-member-node";

/**
 * 직급·역할 줄(가운뎃점) 회귀 테스트.
 *
 * ⚠️ Owner는 직급 자체가 없어 `member.position`이 빈 문자열로 온다(`manage-server.ts`
 *    `position: member.positionName ?? ""`) — 이때 가운뎃점을 그대로 이어 붙이면
 *    `· 없음`처럼 점이 맨 앞에 뜬다(2026-08-19 발견).
 */

function makeMember(overrides: Partial<OrgMember> = {}): OrgMember {
  return {
    id: 1,
    name: "안현",
    position: "",
    roleLabel: "없음",
    authority: AUTHORITY.OWNER,
    status: MEMBER_STATUS.ACTIVE,
    ...overrides,
  };
}

describe("OrgMemberNode — 직급·역할 줄", () => {
  it("직급이 없으면(Owner) 가운뎃점 없이 역할만 적는다", () => {
    const { container } = render(
      <OrgMemberNode member={makeMember({ position: "" })} keyword="" />,
    );

    expect(container.querySelector("p")).toHaveTextContent("없음");
    expect(container.querySelector("p")?.textContent?.trim()).toBe("없음");
  });

  it("직급이 있으면(Leader) 기존대로 '직급 · 역할'을 적는다", () => {
    const { container } = render(
      <OrgMemberNode
        member={makeMember({ position: "팀장", authority: AUTHORITY.LEADER })}
        keyword=""
      />,
    );

    expect(container.querySelector("p")).toHaveTextContent("팀장 · 없음");
  });
});
