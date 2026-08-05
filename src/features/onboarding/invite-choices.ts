import { departmentsWithLeader, fitsRoleAndPosition, type InviteRules } from "./invite-rules";
import type { Invite } from "./types";
import { NO_ROLE_ID, NO_ROLE_LABEL } from "./types";

/**
 * 줄마다 **무엇을 고를 수 있는지** 추리는 곳.
 *
 * ⚠️ 판정 자체는 `invite-rules.ts`가 한다. 여기는 그 판정으로 **목록을 걸러** 화면에 넘긴다 —
 *    화면이 직접 거르면 규칙이 두 벌이 된다.
 */

interface SelectOption {
  id: string;
  name: string;
}

interface ChoiceSources {
  invites: Invite[];
  /** 그 부서 안의 역할들 — 1단계에서 정한다 */
  rolesOf: (departmentId: string) => SelectOption[];
  /** 2단계에서 만든 직급 전부 */
  positionOptions: SelectOption[];
  isLeaderPosition: (positionId: string) => boolean;
  rules: InviteRules;
}

export interface InviteChoices {
  rolesFor: (invite: Invite) => SelectOption[];
  positionsFor: (invite: Invite) => SelectOption[];
  isRoleLocked: (invite: Invite) => boolean;
}

export function createInviteChoices({
  invites,
  rolesOf,
  positionOptions,
  isLeaderPosition,
  rules,
}: ChoiceSources): InviteChoices {
  /**
   * 그 줄에서 고를 수 있는 역할 — 부서 안의 역할들 **앞에 `없음`**을 둔다.
   *
   * ⚠️ `없음`은 빈 값이 아니라 **고른 결과**다(`NO_ROLE_ID`). 빈 값은 "아직 안 골랐다"라서,
   *    둘을 같은 값으로 두면 직급 칸을 언제 열지 알 수 없다.
   * ⚠️ 맨 위에 둔다 — 팀장을 넣을 때 가장 먼저 찾는 항목이다.
   */
  const rolesFor = (invite: Invite): SelectOption[] => {
    const departmentRoles = rolesOf(invite.departmentId);

    /*
      `없음`을 뺄지.
      ⚠️ `없음`으로 갈 수 있는 직급은 **리더뿐**인데, 그 부서에 리더가 이미 있으면
         고르는 순간 직급 목록이 비어 막다른 길이 된다 — 갈 수 없는 길은 보여주지 않는다.
      ⚠️ 단, 역할이 없는 부서는 예외다. 거기선 `없음`이 유일한 선택지이고
         직급도 전부 열린다(`fitsRoleAndPosition`).
    */
    const leaderTaken = departmentsWithLeader(invites, isLeaderPosition, invite.id).has(
      invite.departmentId,
    );
    const isDeadEnd = leaderTaken && departmentRoles.length > 0;
    const keepsNone = !isDeadEnd || invite.roleId === NO_ROLE_ID;

    return keepsNone
      ? [{ id: NO_ROLE_ID, name: NO_ROLE_LABEL }, ...departmentRoles]
      : departmentRoles;
  };

  /**
   * 그 줄에서 고를 수 있는 직급.
   *
   * **고른 역할에 맞는 직급만 연다**(팀 확정) — 판정은 `fitsRoleAndPosition` 한 곳이 한다.
   * 여기서만 더 보는 것: 그 부서에 **리더가 이미 있으면** 리더 직급을 잠근다(부서마다 한 명).
   *
   * ⚠️ 고를 수 없는 항목은 **아예 빼 버린다.** 흐리게 남겨 두면 왜 못 고르는지 설명할 자리가
   *    필요해지고, 좁은 칸에 설명이 붙으면 이름이 밀린다. 이유는 왼쪽 안내가 말한다.
   * ⚠️ 역할을 고친 줄의 직급은 짝이 어긋나면 **비워진다**(`changeInviteRole`).
   *    여기서 막기만 하면 어느 쪽도 못 고치는 줄이 생긴다.
   */
  const positionsFor = (invite: Invite): SelectOption[] => {
    const taken = departmentsWithLeader(invites, isLeaderPosition, invite.id);

    return positionOptions.filter((option) => {
      // 지금 고른 값은 늘 남긴다 — 목록에서 빠지면 칸이 무엇으로 정해졌는지 못 보여준다
      if (option.id === invite.positionId) return true;
      if (!fitsRoleAndPosition({ ...invite, positionId: option.id }, rules)) return false;
      return !(isLeaderPosition(option.id) && taken.has(invite.departmentId));
    });
  };

  /**
   * 역할 칸을 통째로 잠글지.
   * - **리더 직급**이면 역할은 `없음` 하나뿐이다.
   * - **역할이 없는 부서**면 고를 게 `없음`뿐이라 이미 정해져 있다(`changeInviteDepartment`).
   *
   * ⚠️ 항목을 하나씩 잠그지 않는다. 고를 수 없는 줄이 목록을 채우면 무엇이 남았는지
   *    읽히지 않는다 — 칸 자체를 잠그면 `없음`이 그대로 보인다.
   */
  const isRoleLocked = (invite: Invite) =>
    isLeaderPosition(invite.positionId) || !rules.hasRoles(invite.departmentId);

  return { rolesFor, positionsFor, isRoleLocked };
}
