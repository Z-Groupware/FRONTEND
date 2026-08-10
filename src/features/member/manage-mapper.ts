import { AUTHORITY, type Authority } from "@/constants/authority";
import { HANDOVER_TYPE, type HandoverType } from "@/constants/handover";
import { MEMBER_STATUS, type MemberStatus } from "@/constants/member";

import type { ManagedMember, MemberFilter } from "./manage-types";

/**
 * BE shape → UI 계약 (§Mock 격리막 — **shape을 흡수하는 곳은 여기 하나다**).
 *
 * ⚠️ 컴포넌트는 이 파일을 모른다. BE가 모양을 바꾸면 여기만 고친다.
 * ⚠️ **필드 이름이 곳곳에서 다르다.** BE는 `positionName`·`workStatus`, 우리는
 *    `position`·`status`다. 어느 한쪽으로 맞추자고 화면을 고치면 연동할 때마다 화면이 흔들린다.
 */

/**
 * [확인] BE `MemberListItemResponse` — **목록은 상세보다 적게 준다.**
 *
 * ⚠️ **`joinedOn`이다**(`joinedAt` 아님). 이름을 잘못 읽으면 `undefined`가 조용히 빈 문자열이
 *    되어 **입사일 열이 통째로 빈칸**으로 뜬다 — 값이 없는 것과 구분이 안 된다.
 * ⚠️ **목록에는 `email`이 없다.** 표가 그 열을 안 그리므로(WORKFLOW §9: 이름·팀·직급·권한·
 *    역할·상태·입사일) 문제가 아니고, 상세(`BeMemberDetail`)에는 있다.
 * ⚠️ **목록에는 `pendingHandoverType`도 없다.** 거르기는 이제 서버가 하므로(`filter`
 *    파라미터) 화면이 그 값을 볼 일이 없다 — 목으로 돌 때만 쓰인다.
 */
export interface BeMemberListItem {
  memberId: number;
  name: string;
  teamName: string | null;
  positionName: string | null;
  role: string;
  isAdmin: boolean;
  roleLabel: string | null;
  workStatus: string;
  /** `2020-01-02` — Jackson이 `LocalDate`를 ISO 문자열로 내린다 */
  joinedOn: string | null;
}

/** [확인] BE `MemberDetailResponse` — 목록에 없는 `email`·`teamId`·`jobPositionId`가 더 있다 */
export interface BeMemberDetail extends BeMemberListItem {
  teamId: number | null;
  jobPositionId: number | null;
  email: string | null;
}

/**
 * 화면 필터 → BE 필터.
 *
 * ⚠️ **이름이 다르다.** 우리는 `VACATION_PENDING`(휴직), BE는 `LEAVE_PENDING`이다 —
 *    그대로 보내면 Spring이 enum 변환에 실패해 **400**이 난다. 상수를 화면 쪽에 맞춰 둔 건
 *    화면 문구가 "휴직"이기 때문이고, 그 간극을 메우는 게 매퍼의 일이다.
 */
export function toBeFilter(filter: MemberFilter): string {
  if (filter === "VACATION_PENDING") return "LEAVE_PENDING";
  return filter;
}

/**
 * 권한 문자열 → 우리 상수.
 *
 * ⚠️ **모르는 값이 오면 가장 낮은 권한으로 떨어뜨린다.** BE가 역할을 하나 늘렸을 때
 *    화면이 터지는 것보다, 덜 보이는 쪽이 안전하다 — 권한은 넘겨짚으면 안 되는 값이다(§권한).
 */
function toAuthority(role: string): Authority {
  switch (role) {
    case AUTHORITY.OWNER:
      return AUTHORITY.OWNER;
    case AUTHORITY.LEADER:
      return AUTHORITY.LEADER;
    default:
      return AUTHORITY.MEMBER;
  }
}

/**
 * 근무 상태 → 우리 상수.
 *
 * ⚠️ 소프트 딜리트(`DELETED`)는 **상태가 아니라 목록에서 빠지는 일**이다(§도메인 상수) —
 *    그 판정은 부르는 쪽이 `isVisibleMemberStatus`로 한다. 여기서는 값만 옮긴다.
 */
function toMemberStatus(workStatus: string): MemberStatus {
  return (Object.values(MEMBER_STATUS) as string[]).includes(workStatus)
    ? (workStatus as MemberStatus)
    : MEMBER_STATUS.ACTIVE;
}

/**
 * 대기 중인 신청 종류.
 *
 * ⚠️ BE의 `LEAVE`는 우리 `VACATION`이다(필터와 같은 간극).
 * ⚠️ **`null`을 지어내지 않는다.** 모르는 값이면 `null`로 두어 "대기 없음"이 되는데,
 *    그건 승인이 필요한 사람을 목록에서 감추는 일이다 — 대신 모르면 그대로 두고
 *    거르기에서만 빠지게 한다.
 */
function toPendingHandoverType(value: string | null): HandoverType | null {
  if (!value) return null;
  if (value === "LEAVE" || value === HANDOVER_TYPE.VACATION) return HANDOVER_TYPE.VACATION;
  if (value === HANDOVER_TYPE.OFFBOARDING) return HANDOVER_TYPE.OFFBOARDING;
  return null;
}

export function toManagedMember(item: BeMemberListItem | BeMemberDetail): ManagedMember {
  return {
    id: item.memberId,
    name: item.name,
    /*
      ⚠️ **목록에는 이메일이 없다.** 표가 그 열을 안 그리므로 빈 문자열로 둔다 —
         지어내지 않는다. 상세는 실제 값이 온다.
    */
    email: "email" in item ? (item.email ?? "") : "",
    /*
      ⚠️ **빈 문자열을 `null`로 되돌린다.** 우리 계약은 "팀 없음"을 `null`로 적기로 했고
         (Owner는 팀이 없다), 빈 문자열은 "이름이 없는 팀"과 구분이 안 된다.
    */
    teamName: item.teamName?.trim() ? item.teamName : null,
    position: item.positionName ?? "",
    authority: toAuthority(item.role),
    isAdmin: item.isAdmin,
    roleLabel: item.roleLabel?.trim() ? item.roleLabel : null,
    status: toMemberStatus(item.workStatus),
    joinedAt: item.joinedOn ?? "",
    /*
      ⚠️ **목록 응답에 없다.** 휴직·오프보딩 대기 구분은 이제 서버 `filter`가 하므로
         화면이 이 값을 볼 일이 없다 — 목으로 돌 때만 채워진다.
    */
    pendingHandoverType: null,
  };
}
