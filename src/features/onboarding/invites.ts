import {
  fitsRoleAndPosition,
  type InviteRules,
  isValidEmail,
  normalizeEmail,
} from "./invite-rules";
import type { Invite } from "./types";
import { NO_ROLE_ID } from "./types";

/**
 * 초대 목록 조작 — 전부 순수 함수다(원본을 바꾸지 않는다).
 *
 * ⚠️ 판정 규칙(주소가 맞는가 · 역할과 직급의 짝 · 부서당 리더 한 명)은 `invite-rules.ts`에 있다.
 *    여기는 **바꾸는 일**만 한다.
 */

/**
 * 빈 초대 한 줄.
 *
 * ⚠️ **부서·직급을 미리 골라 두지 않는다**(2026-08-04). 첫 부서가 자동으로 들어가 있으면
 *    그 줄을 확인도 안 하고 넘긴 사람이 엉뚱한 부서로 초대장을 받는다 — 골랐다는 흔적 없이
 *    값만 채워져 있는 게 더 위험하다. 화면에는 `선택`으로 뜬다.
 * ⚠️ id를 밖에서 받는다 — 첫 줄은 서버에서도 렌더되므로 `crypto.randomUUID()`처럼
 *    호출할 때마다 달라지는 값을 쓰면 서버·클라이언트 결과가 어긋난다(hydration 오류).
 */
export function createInvite(id: string): Invite {
  return {
    id,
    name: "",
    email: "",
    departmentId: "",
    roleId: "",
    positionId: "",
    isAdmin: false,
    isSent: false,
  };
}

/**
 * 다음 줄에 붙일 id — 현재 목록에서 가장 큰 번호 + 1.
 * ⚠️ 무작위 값(`crypto.randomUUID()`)을 쓰면 서버와 브라우저가 다른 id를 만들어
 *    첫 렌더가 어긋난다(hydration 오류). 목록만 보고 정해지는 값이어야 한다.
 */
export function nextInviteId(invites: Invite[]): string {
  const largest = invites.reduce((max, invite) => {
    const serial = Number(invite.id.replace("invite-", ""));
    return Number.isFinite(serial) && serial > max ? serial : max;
  }, 0);

  return `invite-${largest + 1}`;
}

/**
 * 값 바꾸기는 전부 이 문을 지난다.
 * ⚠️ **이미 나간 초대장은 고칠 수 없다**(`isSent`). 화면에서 잠그는 것만으로는 부족하다 —
 *    키보드·프로그램 경로로도 들어올 수 있어서 여기서 막는다.
 */
function updateInvite(invites: Invite[], id: string, patch: Partial<Invite>): Invite[] {
  return invites.map((invite) =>
    invite.id === id && !invite.isSent ? { ...invite, ...patch } : invite,
  );
}

export function changeInviteName(invites: Invite[], id: string, name: string): Invite[] {
  return updateInvite(invites, id, { name });
}

export function changeInviteEmail(invites: Invite[], id: string, email: string): Invite[] {
  return updateInvite(invites, id, { email });
}

/**
 * 역할 바꾸기.
 *
 * 역할과 직급은 짝이 맞아야 한다(팀 확정).
 * - **리더 직급은 역할이 `없음`일 때만** — 부서 전체를 맡는 자리라 부서 안의 한 역할에 못 매인다.
 * - **리더가 아닌 직급은 역할이 있어야 한다** — 부서에만 걸쳐 두면 무슨 일을 하는지가 빈다.
 *
 * ⚠️ 짝이 어긋나면 **직급을 비운다.** 막기만 하면 빠져나갈 수 없는 줄이 생긴다 —
 *    `과장 + 프론트엔드`에서 팀장으로 가려면 역할을 `없음`으로 바꿔야 하는데,
 *    그 `없음`이 과장 때문에 막혀 있으면 어느 쪽도 못 고친다.
 */
export function changeInviteRole(
  invites: Invite[],
  id: string,
  roleId: string,
  rules: InviteRules,
): Invite[] {
  const target = invites.find((invite) => invite.id === id);
  if (!target) return invites;

  const fits = fitsRoleAndPosition({ ...target, roleId }, rules);
  return updateInvite(invites, id, fits ? { roleId } : { roleId, positionId: "" });
}

/**
 * 부서 바꾸기 — 역할은 비운다(다른 부서의 역할이 남으면 안 된다).
 *
 * ⚠️ **역할이 하나도 없는 부서면 곧장 `없음`으로 정한다.** 고를 게 `없음` 하나뿐인데
 *    한 번 더 고르게 하면 의미 없는 손이 한 번 더 든다 — 역할 칸은 그대로 잠긴다.
 */
export function changeInviteDepartment(
  invites: Invite[],
  id: string,
  departmentId: string,
  rules: InviteRules,
): Invite[] {
  // 부서가 바뀌면 역할은 비운다 — 다른 부서의 역할이 남아 있으면 안 된다
  const roleId = rules.hasRoles(departmentId) ? "" : NO_ROLE_ID;
  return updateInvite(invites, id, { departmentId, roleId });
}

/**
 * 직급 바꾸기.
 *
 * ⚠️ **리더 직급을 고르면 역할을 함께 비운다.** 리더는 부서 전체를 맡는 자리라 부서 안의 한
 *    역할(프론트엔드 등)에 매이면 관리 범위가 어긋난다. 화면에서 못 고르게 막는 것만으로는
 *    부족하다 — 역할을 먼저 고른 뒤 직급을 리더로 바꾸는 순서가 남는다.
 * ⚠️ 조용히 지우는 게 아니다. 역할 칸이 그 자리에서 `없음`으로 바뀌는 게 바로 보인다.
 */
export function changeInvitePosition(
  invites: Invite[],
  id: string,
  positionId: string,
  rules: InviteRules,
): Invite[] {
  const patch = rules.isLeaderPosition(positionId)
    ? { positionId, roleId: NO_ROLE_ID }
    : { positionId };
  return updateInvite(invites, id, patch);
}

/**
 * Admin 겸직을 켜고 끈다.
 * ⚠️ 이미 나간 초대장은 못 고친다 — `updateInvite`가 `isSent`를 걸러 준다.
 * ⚠️ **몇 명까지인지 제한을 두지 않는다.** 예전엔 시스템이 계정을 발급해 기업당 1명이었지만,
 *    이제는 사람에게 붙는 권한이라 그 근거가 사라졌다(팀 확인 필요 시 여기서 막는다).
 */
export function toggleInviteAdmin(invites: Invite[], id: string): Invite[] {
  const target = invites.find((invite) => invite.id === id);
  if (!target) return invites;
  return updateInvite(invites, id, { isAdmin: !target.isAdmin });
}

export function removeInvite(invites: Invite[], id: string): Invite[] {
  return invites.filter((invite) => invite.id !== id);
}

/**
 * 이번에 발송될 줄 — 주소가 유효하고 **아직 안 보낸** 줄만.
 *
 * 이미 보낸 줄은 다시 보내지 않는다. 같은 주소가 여러 줄에 적혀 있으면 **첫 줄만** 나간다
 * — 화면에 중복 경고를 띄워도 그대로 누를 수 있어서, 같은 사람이 초대장을 두 번 받는다.
 */
export function sendableInvites(invites: Invite[]): Invite[] {
  // 이미 나간 주소로 시작한다 — 같은 주소를 새 줄에 다시 적어도 두 번 가지 않게
  const seen = new Set(
    invites.filter((invite) => invite.isSent).map((invite) => normalizeEmail(invite.email)),
  );

  return invites.filter((invite) => {
    if (invite.isSent || !isValidEmail(invite.email)) return false;
    // 부서·역할·직급을 다 고르지 않은 줄은 보내지 않는다 — 어디 소속인지 모르는 계정이 생긴다.
    // 역할은 `없음`도 고른 것이다(`NO_ROLE_ID`) — 빈 값만 "아직 안 골랐다"는 뜻이다.
    if (!invite.departmentId || !invite.roleId || !invite.positionId) return false;

    const address = normalizeEmail(invite.email);
    if (seen.has(address)) return false;

    seen.add(address);
    return true;
  });
}

/** 발송 처리 — 이번에 나간 줄에만 도장을 찍는다. 나머지는 그대로 둔다. */
export function markInvitesSent(invites: Invite[]): Invite[] {
  const going = new Set(sendableInvites(invites).map((invite) => invite.id));
  return invites.map((invite) => (going.has(invite.id) ? { ...invite, isSent: true } : invite));
}
