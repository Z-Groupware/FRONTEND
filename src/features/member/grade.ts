import { ADMIN_ELIGIBLE_AUTHORITIES } from "@/constants/authority";

import type { ManagedMember } from "./manage-types";

/**
 * 이 사람의 직급·권한을 **이 화면에서** 고칠 수 있는가.
 *
 * ⚠️ Owner는 못 고친다. 회사에 하나뿐인 자리라 옮기는 일이 "권한 변경"이 아니라 **대표 교체**이고,
 *    그건 이 화면이 다루는 일이 아니다(§명세에 없는 기능은 안 만든다).
 * ⚠️ **판정을 한 곳에 둔다.** 폼 카드와 사람 카드가 각자 세면, 한쪽은 폼을 감추고 다른 쪽은
 *    이유를 안 적는 상태가 조용히 생긴다.
 * ⚠️ 화면 판정일 뿐이다 — 진짜 검사는 Server Action이 다시 한다(§권한: 화면 숨김은 보안이 아니다).
 */
export function canChangeGradeOf(member: ManagedMember): boolean {
  const eligible: readonly string[] = ADMIN_ELIGIBLE_AUTHORITIES;
  return eligible.includes(member.authority);
}
