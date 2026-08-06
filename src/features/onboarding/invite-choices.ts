import { departmentsWithLeader, type InviteRules } from "./invite-rules";
import type { Invite, SelectOption } from "./types";
import { LEADER_ROLE_ID, LEADER_ROLE_LABEL, NO_ROLE_ID, NO_ROLE_LABEL } from "./types";

/**
 * 줄마다 **무엇을 고를 수 있는지** 추리는 곳.
 *
 * ⚠️ 판정 자체는 `invite-rules.ts`가 한다. 여기는 그 판정으로 **목록을 걸러** 화면에 넘긴다 —
 *    화면이 직접 거르면 규칙이 두 벌이 된다.
 */

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
   * 그 줄에서 고를 수 있는 역할.
   *
   * ⚠️ **리더 직급이면 `리더` 하나뿐이다.** 고르는 게 아니라 이미 정해진 값이고 칸은 잠긴다
   *    (`isRoleLocked`). 목록에 그 값이 있어야 잠긴 칸이 무엇으로 정해졌는지 보여 줄 수 있다 —
   *    전에는 여기 `없음`이 들어가서, 팀장 줄이 "역할을 안 정했다"로 읽혔다.
   * ⚠️ `없음`은 **역할이 하나도 없는 부서**에서만 나온다. 그런 부서에서는 그게 유일한
   *    선택지이고 직급도 전부 열린다(`fitsRoleAndPosition`).
   * ⚠️ `없음`도 빈 값이 아니라 **고른 결과**다(`NO_ROLE_ID`). 빈 값은 "아직 안 골랐다"라서,
   *    둘을 같은 값으로 두면 직급 칸을 언제 열지 알 수 없다.
   */
  const rolesFor = (invite: Invite): SelectOption[] => {
    if (isLeaderPosition(invite.positionId)) {
      return [{ id: LEADER_ROLE_ID, name: LEADER_ROLE_LABEL }];
    }

    const departmentRoles = rolesOf(invite.departmentId);
    if (departmentRoles.length > 0) return departmentRoles;

    return [{ id: NO_ROLE_ID, name: NO_ROLE_LABEL }];
  };

  /**
   * 그 줄에서 고를 수 있는 직급.
   *
   * 막는 건 **하나뿐이다 — 그 부서에 리더가 이미 있으면 리더 직급을 뺀다**(부서마다 한 명).
   *
   * ⚠️ **역할로 직급을 막지 않는다.** 이제 직급이 역할을 정한다(자동부여) — 리더를 고르면
   *    역할이 `리더`로 덮이고, 리더에서 내려오면 역할이 비워진다(`changeInvitePosition`).
   *    전에는 역할에 맞는 직급만 열었는데, 그러면 실제 역할을 고른 뒤에는 리더로 갈 길이
   *    막혔다 — 빠져나가려면 역할을 `없음`으로 되돌려야 했고 그 선택지도 사라졌다.
   * ⚠️ 고를 수 없는 항목은 **아예 빼 버린다.** 흐리게 남겨 두면 왜 못 고르는지 설명할 자리가
   *    필요해지고, 좁은 칸에 설명이 붙으면 이름이 밀린다. 이유는 왼쪽 안내가 말한다.
   */
  const positionsFor = (invite: Invite): SelectOption[] => {
    const taken = departmentsWithLeader(invites, isLeaderPosition, invite.id);

    return positionOptions.filter((option) => {
      // 지금 고른 값은 늘 남긴다 — 목록에서 빠지면 칸이 무엇으로 정해졌는지 못 보여준다
      if (option.id === invite.positionId) return true;
      return !(isLeaderPosition(option.id) && taken.has(invite.departmentId));
    });
  };

  /**
   * 역할 칸을 통째로 잠글지.
   * - **리더 직급**이면 역할은 `리더`로 자동으로 채워진다(`changeInvitePosition`).
   * - **역할이 없는 부서**면 고를 게 `없음`뿐이라 이미 정해져 있다(`changeInviteDepartment`).
   *
   * ⚠️ 항목을 하나씩 잠그지 않는다. 고를 수 없는 줄이 목록을 채우면 무엇이 남았는지
   *    읽히지 않는다 — 칸 자체를 잠그면 정해진 값이 그대로 보인다.
   */
  const isRoleLocked = (invite: Invite) =>
    isLeaderPosition(invite.positionId) || !rules.hasRoles(invite.departmentId);

  return { rolesFor, positionsFor, isRoleLocked };
}
