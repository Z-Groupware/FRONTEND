import type { Invite } from "./types";
import { NO_ROLE_ID } from "./types";

/** 초대 목록 조작 — 전부 순수 함수다(원본을 바꾸지 않는다). */

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
 * 초대장을 보낼 수 있는 주소인지.
 * ⚠️ 최종 판정은 서버가 한다 — 여기서는 오타를 즉시 잡아주는 정도만 본다.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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
 * 역할·직급 짝 규칙을 판정할 때 필요한 것들.
 * 화면이 아는 값(2단계 직급 권한 · 1단계 부서 트리)을 함수에 넘겨준다.
 */
export interface InviteRules {
  /** 그 직급이 리더 권한인가 — 2단계에서 정한다 */
  isLeaderPosition: (positionId: string) => boolean;
  /** 그 부서에 고를 역할이 하나라도 있는가 — 1단계에서 정한다 */
  hasRoles: (departmentId: string) => boolean;
}

/**
 * 역할과 직급의 짝이 맞는가 — **이 규칙은 여기 한 곳에만 둔다.**
 *
 * - 리더 직급은 역할이 `없음`일 때만.
 * - 리더가 아닌 직급은 역할이 있어야 한다.
 * - ⚠️ **역할이 하나도 없는 부서는 예외**다. 고를 역할이 `없음`뿐이라 규칙을 그대로 적용하면
 *   그 부서에는 팀장 한 명밖에 못 들어간다. 1단계에서 부서 아래를 비워둘 수 있으므로
 *   실제로 생길 수 있는 부서다(CLAUDE.md §조직 계층).
 * - 아직 안 고른 칸(빈 값)은 판정하지 않는다 — 고르는 중이다.
 */
export function fitsRoleAndPosition(invite: Invite, rules: InviteRules): boolean {
  if (!invite.roleId || !invite.positionId) return true;
  if (!rules.hasRoles(invite.departmentId)) return true;

  return invite.roleId === NO_ROLE_ID
    ? rules.isLeaderPosition(invite.positionId)
    : !rules.isLeaderPosition(invite.positionId);
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

/**
 * 두 번 이상 적힌 주소(소문자 기준).
 * 같은 사람에게 초대장이 두 번 가는 것을 막으려고 화면에서 먼저 표시한다.
 */
export function duplicateEmails(invites: Invite[]): Set<string> {
  const seen = new Set<string>();
  const duplicated = new Set<string>();

  for (const invite of invites) {
    const email = normalizeEmail(invite.email);
    if (!email) continue;
    if (seen.has(email)) duplicated.add(email);
    seen.add(email);
  }

  return duplicated;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * 부서마다 리더는 한 명이다 — 이미 리더가 있는 부서의 id 모음.
 * `exceptId`는 자기 줄을 빼고 센다(자기가 리더인 줄에서 다시 리더를 고를 수 있어야 한다).
 */
export function departmentsWithLeader(
  invites: Invite[],
  isLeaderPosition: (positionId: string) => boolean,
  exceptId?: string,
): Set<string> {
  const taken = new Set<string>();
  for (const invite of invites) {
    if (invite.id === exceptId) continue;
    /*
      ⚠️ **주소가 비어도 자리를 차지한다.** 전에는 주소 없는 줄을 빼고 셌는데, 그러면
         리더로 골라 둔 줄이 여러 개 만들어진 뒤 주소만 채우면 한 부서에 리더가 여럿 남는다.
         직급은 부서·역할을 고른 뒤에야 열리므로, 리더로 고른 줄은 이미 작정한 줄이다.
    */
    if (isLeaderPosition(invite.positionId)) taken.add(invite.departmentId);
  }
  return taken;
}

/**
 * 같은 부서에 리더가 둘 이상인 줄 — 화면에서 표시한다.
 * 앞줄을 정상으로 보고 **뒤에 온 줄만** 문제로 잡는다.
 */
export function duplicatedLeaderIds(
  invites: Invite[],
  isLeaderPosition: (positionId: string) => boolean,
): Set<string> {
  const seen = new Set<string>();
  const duplicated = new Set<string>();

  for (const invite of invites) {
    // ⚠️ 주소가 비어도 센다 — `departmentsWithLeader`와 같은 기준이어야 화면과 경고가 어긋나지 않는다
    if (!isLeaderPosition(invite.positionId)) continue;
    if (seen.has(invite.departmentId)) duplicated.add(invite.id);
    else seen.add(invite.departmentId);
  }
  return duplicated;
}
