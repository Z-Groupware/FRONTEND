"use client";

import { useMemo, useState } from "react";

import { duplicateEmails, type InviteRules, normalizeEmail } from "./invite-rules";
import {
  changeInviteDepartment,
  changeInviteEmail,
  changeInviteName,
  changeInvitePosition,
  changeInviteRole,
  createInvite,
  markInvitesSent,
  nextInviteId,
  removeInvite,
  sendableInvites,
  toggleInviteAdmin,
} from "./invites";
import type { Invite } from "./types";
import { LEADER_ROLE_ID, NO_ROLE_ID } from "./types";

/**
 * 초대 목록 편집 상태.
 * 목록 조작은 `invites.ts`의 순수 함수가 하고, 여기서는 **무엇을 언제 부를지**만 정한다.
 */
export function useInviteList(rules: InviteRules) {
  const newInvite = (prev: Invite[]) => createInvite(nextInviteId(prev));

  const [invites, setInvites] = useState<Invite[]>(() => [createInvite(nextInviteId([]))]);

  const sendable = useMemo(() => sendableInvites(invites), [invites]);
  const duplicated = useMemo(() => duplicateEmails(invites), [invites]);

  return {
    invites,
    /** 이번에 나갈 줄 — 주소가 유효하고 아직 안 보낸 것만 */
    sendable,
    /** 이 줄의 주소가 위에 또 있는지 — 화면에서 표시해 준다 */
    isDuplicated: (invite: Invite) => duplicated.has(normalizeEmail(invite.email)),
    addRow: () => setInvites((prev) => [...prev, newInvite(prev)]),
    changeName: (id: string, name: string) =>
      setInvites((prev) => changeInviteName(prev, id, name)),
    changeEmail: (id: string, email: string) =>
      setInvites((prev) => changeInviteEmail(prev, id, email)),
    changeDepartment: (id: string, departmentId: string) =>
      setInvites((prev) => changeInviteDepartment(prev, id, departmentId, rules)),
    /** ⚠️ 짝이 안 맞는 직급은 함께 비워진다(`changeInviteRole`) */
    changeRole: (id: string, roleId: string) =>
      setInvites((prev) => changeInviteRole(prev, id, roleId, rules)),
    /** ⚠️ 리더 직급이면 역할이 `리더`로 자동으로 채워진다(`changeInvitePosition`) */
    changePosition: (id: string, positionId: string) =>
      setInvites((prev) => changeInvitePosition(prev, id, positionId, rules)),
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

          // 사라진 부서·직급은 **비운다**. 다른 값으로 바꿔 놓으면 고른 적 없는 곳으로 초대장이 간다
          const departmentId = departmentIds.has(invite.departmentId) ? invite.departmentId : "";
          return {
            ...invite,
            departmentId,
            /*
              부서가 바뀌었거나 그 역할이 사라졌으면 비운다.
              ⚠️ **예약값 둘(`리더`·`없음`)은 살아남는다** — 어느 부서에서나 뜻이 같다.
                 `리더`를 여기서 지우면 부서만 옮겼는데 팀장 표시가 사라진다.
            */
            roleId:
              invite.roleId === LEADER_ROLE_ID ||
              invite.roleId === NO_ROLE_ID ||
              roleIdsOf(departmentId).has(invite.roleId)
                ? invite.roleId
                : "",
            positionId: positionIds.has(invite.positionId) ? invite.positionId : "",
          };
        }),
      ),
  };
}
