import { ROLE_NONE_LABEL } from "@/constants/member";
import type { DepartmentNode } from "@/features/company/types";

/**
 * 팀 이름 → 그 팀의 역할 이름들.
 *
 * ⚠️ **역할은 팀에 매여 있다.** 개발팀의 `프론트엔드`를 마케팅팀 사람에게 붙일 수 없다 —
 *    팀을 바꾸면 역할도 다시 골라야 한다(온보딩 초대 줄과 같은 규칙).
 * ⚠️ 트리에서 **한 겹만** 본다. 팀 아래 역할이 조직 계층의 끝이다(2계층, DECISIONS).
 * ⚠️ 화면과 Server Action이 **같은 함수**를 쓴다. 각자 트리를 헤집으면 화면은 막는데
 *    저장은 되는 값이 생긴다(§권한: 화면 숨김은 보안이 아니다).
 */
export function buildTeamRoles(departments: DepartmentNode[]): Record<string, string[]> {
  return Object.fromEntries(
    departments.map((team) => [team.name, team.children.map((role) => role.name)]),
  );
}

/**
 * 그 팀에서 고를 수 있는 역할인지.
 *
 * ⚠️ **`없음`(빈 값)은 늘 통과한다.** 역할은 안 붙여도 되는 값이라(WORKFLOW §9),
 *    역할이 하나도 없는 팀도 있고 붙이지 않은 사람도 있다.
 */
export function isRoleOfTeam(
  teamRoles: Record<string, string[]>,
  teamName: string,
  roleLabel: string,
): boolean {
  if (!roleLabel) return true;
  return (teamRoles[teamName] ?? []).includes(roleLabel);
}

/**
 * 화면의 역할 값 → BE `roleLabel` 요청 값.
 *
 * ⚠️ **빈 문자열을 그대로 보내면 400이다.** BE가 `@Pattern("(?s).*\S.*")`로 빈 값을 거절한다 —
 *    `null`은 "안 바꾼다"는 뜻이라 비우기에 못 쓴다. **비우기는 문자열 `"없음"`이다** —
 *    역할 미부여를 뜻하는 시스템 행이 실제로 있다(BE V2.3.9).
 *    [확인] BE `UpdateMemberRoleRequest.roleLabel` 2026-08-13 develop(`30952c10`).
 * ⚠️ 값이 있으면 회사에 실제로 있는 이름이어야 한다(없으면 BE가 404 `AU-039`) —
 *    그건 `isRoleOfTeam`이 먼저 거른다. 여기는 빈 값 변환만 맡는다.
 */
export function toBeRoleLabel(roleLabel: string): string {
  return roleLabel.trim() || ROLE_NONE_LABEL;
}
