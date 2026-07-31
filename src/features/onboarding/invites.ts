import type { Invite } from "./types";

/** 초대 목록 조작 — 전부 순수 함수다(원본을 바꾸지 않는다). */

/**
 * 빈 초대 한 줄.
 * ⚠️ id를 밖에서 받는다 — 첫 줄은 서버에서도 렌더되므로 `crypto.randomUUID()`처럼
 *    호출할 때마다 달라지는 값을 쓰면 서버·클라이언트 결과가 어긋난다(hydration 오류).
 */
export function createInvite(id: string, departmentId: string, positionId: string): Invite {
  return { id, email: "", departmentId, roleId: "", positionId, isSent: false };
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

export function changeInviteEmail(invites: Invite[], id: string, email: string): Invite[] {
  return updateInvite(invites, id, { email });
}

export function changeInviteRole(invites: Invite[], id: string, roleId: string): Invite[] {
  return updateInvite(invites, id, { roleId });
}

export function changeInviteDepartment(
  invites: Invite[],
  id: string,
  departmentId: string,
): Invite[] {
  // 부서가 바뀌면 역할은 비운다 — 다른 부서의 역할이 남아 있으면 안 된다
  return updateInvite(invites, id, { departmentId, roleId: "" });
}

export function changeInvitePosition(invites: Invite[], id: string, positionId: string): Invite[] {
  return updateInvite(invites, id, { positionId });
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

    const address = normalizeEmail(invite.email);
    if (seen.has(address)) return false;

    seen.add(address);
    return true;
  });
}

/** 이미 보낸 줄. 화면에서 잠그고 미리보기에 남긴다. */
export function sentInvites(invites: Invite[]): Invite[] {
  return invites.filter((invite) => invite.isSent);
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
    // 주소가 비었으면 아직 초대가 아니다 — 리더 자리를 차지하지 않는다
    if (!invite.email.trim()) continue;
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
    if (!invite.email.trim()) continue;
    if (!isLeaderPosition(invite.positionId)) continue;
    if (seen.has(invite.departmentId)) duplicated.add(invite.id);
    else seen.add(invite.departmentId);
  }
  return duplicated;
}
