"use client";

import { useMemo, useState } from "react";

import {
  changeInviteDepartment,
  changeInviteEmail,
  changeInvitePosition,
  changeInviteRole,
  createInvite,
  duplicateEmails,
  markInvitesSent,
  nextInviteId,
  normalizeEmail,
  removeInvite,
  sendableInvites,
  sentInvites,
  toggleInviteAdmin,
} from "./invites";
import type { Invite } from "./types";

/**
 * 초대 목록 편집 상태.
 * 목록 조작은 `invites.ts`의 순수 함수가 하고, 여기서는 **무엇을 언제 부를지**만 정한다.
 */
export function useInviteList(defaultDepartmentId: string, defaultPositionId: string) {
  const newInvite = (prev: Invite[]) =>
    createInvite(nextInviteId(prev), defaultDepartmentId, defaultPositionId);

  const [invites, setInvites] = useState<Invite[]>(() => [
    createInvite(nextInviteId([]), defaultDepartmentId, defaultPositionId),
  ]);

  const sendable = useMemo(() => sendableInvites(invites), [invites]);
  const sent = useMemo(() => sentInvites(invites), [invites]);
  const duplicated = useMemo(() => duplicateEmails(invites), [invites]);

  return {
    invites,
    /** 이번에 나갈 줄 — 주소가 유효하고 아직 안 보낸 것만 */
    sendable,
    /** 이미 나간 줄 — 화면에서 잠근다 */
    sent,
    /** 이 줄의 주소가 위에 또 있는지 — 화면에서 표시해 준다 */
    isDuplicated: (invite: Invite) => duplicated.has(normalizeEmail(invite.email)),
    addRow: () => setInvites((prev) => [...prev, newInvite(prev)]),
    changeEmail: (id: string, email: string) =>
      setInvites((prev) => changeInviteEmail(prev, id, email)),
    changeDepartment: (id: string, departmentId: string) =>
      setInvites((prev) => changeInviteDepartment(prev, id, departmentId)),
    /** 역할 — 빈 문자열이면 "없음"(부서에 바로 소속) */
    changeRole: (id: string, roleId: string) =>
      setInvites((prev) => changeInviteRole(prev, id, roleId)),
    changePosition: (id: string, positionId: string) =>
      setInvites((prev) => changeInvitePosition(prev, id, positionId)),
    /** Admin 겸직 — 역할을 바꾸지 않고 그 위에 얹거나 뗀다 */
    toggleAdmin: (id: string) => setInvites((prev) => toggleInviteAdmin(prev, id)),
    /** 마지막 한 줄은 남긴다 — 줄이 0개면 다시 추가할 곳이 사라진다 */
    remove: (id: string) =>
      setInvites((prev) => (prev.length === 1 ? [newInvite(prev)] : removeInvite(prev, id))),
    /** 발송 — 이번에 나간 줄을 잠근다. 이미 보낸 줄은 건드리지 않는다 */
    markSent: () => setInvites((prev) => markInvitesSent(prev)),
    /** 임시 보관함에서 되돌릴 때만 쓴다(draft.ts) */
    reset: (next: Invite[]) => setInvites(next.length > 0 ? next : [newInvite([])]),
    /**
     * 부서·직급 목록이 바뀌었을 때 — 사라진 부서를 가리키던 줄을 기본값으로 되돌린다.
     * (1단계에서 부서를 지우고 3단계로 온 경우)
     *
     * ⚠️ **이미 나간 줄은 건드리지 않는다.** 보낸 내용과 화면이 달라지면 안 된다.
     */
    remapToOptions: (
      departmentIds: Set<string>,
      positionIds: Set<string>,
      roleIdsOf: (departmentId: string) => Set<string>,
    ) =>
      setInvites((prev) =>
        prev.map((invite) => {
          if (invite.isSent) return invite;

          const departmentId = departmentIds.has(invite.departmentId)
            ? invite.departmentId
            : defaultDepartmentId;
          return {
            ...invite,
            departmentId,
            // 부서가 바뀌었거나 그 역할이 사라졌으면 "없음"으로 되돌린다
            roleId: roleIdsOf(departmentId).has(invite.roleId) ? invite.roleId : "",
            positionId: positionIds.has(invite.positionId) ? invite.positionId : defaultPositionId,
          };
        }),
      ),
  };
}
