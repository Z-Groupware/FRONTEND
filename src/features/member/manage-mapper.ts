import { AUTHORITY, type Authority } from "@/constants/authority";
import type { ActionStatus } from "@/constants/domain";
import type { MemberStatus } from "@/constants/member";

import type { ManagedMember, ManagedMemberAction, MemberFilter } from "./manage-types";

/**
 * `GET /api/company/actions` 응답 원소 중 **이 화면이 실제로 읽는 것만** 적는다.
 *
 * ⚠️ 액션 도메인의 `BeActionSummary`(`features/action/mapper.ts`)와 **같은 BE DTO**를
 *    가리키지만 일부러 재사용하지 않는다 — 그쪽은 스무 개 필드를 다 적어 두었고, 이 카드가
 *    거기 얹히면 액션 목록 계약이 바뀔 때마다 사원 관리 화면까지 끌려간다(§Mock 격리막:
 *    도메인마다 자기 계약을 갖는다).
 */
export interface BeCompanyAction {
  id: number;
  title: string;
  status: ActionStatus;
  /** 마감일 `YYYY-MM-DD` — BE `Action.dueDate`는 필수값이라 `null`이 안 온다. */
  dueDate: string;
}

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

/**
 * [확인] BE `MemberDetailResponse` — 목록에 없는 `email`·`teamId`·`jobPositionId`·`roleId`가
 * 더 있다.
 *
 * ⚠️ **`roleId`는 상세에만 있다**(2026-08-14 BE PR #489). 목록·조직도는 계속 `roleLabel`
 *    (표시용)만 주고, 폼이 선택 상태를 잡을 때 쓰는 id는 상세 조회에만 실려 온다.
 */
export interface BeMemberDetail extends BeMemberListItem {
  teamId: number | null;
  jobPositionId: number | null;
  email: string | null;
  roleId: number | null;
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
 * ⚠️ **모르는 값을 `ACTIVE`로 바꾸지 않는다.** 그러면 `DELETED`처럼 목록에서 빠져야 할 사람이
 *    **재직 중으로 되살아나고**, BE가 상태를 하나 늘렸을 때 그 사람들이 전부 재직으로 뭉친다 —
 *    화면이 거짓말을 한다(§정직성). 원문을 그대로 넘겨 `isVisibleMemberStatus`가 거르게 둔다.
 */
function toMemberStatus(workStatus: string): MemberStatus {
  return workStatus as MemberStatus;
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

/**
 * `GET /api/company/actions` 한 줄 → 사원 상세의 담당 액션 한 줄.
 *
 * [확인] BE 실코드 대조(2026-08-13) — `action/presentation/api/CompanyActionController.java`,
 * 응답 원소는 `ActionSummaryResponse`(개인 액션 목록과 **같은 DTO를 재사용**한다).
 *
 * ⚠️ **이 카드가 쓰는 네 값만 옮긴다.** 응답엔 `projectTag`·`teamName`·`sourceMeetingTitle`·
 *    `parentActionTitle`까지 오지만, 카드는 `액션 · 상태 · 마감` 세 열뿐이다(§명세: 화면에
 *    없는 걸 새로 만들지 않는다). 안 쓰는 필드를 옮겨 두면 화면이 의존하는 값처럼 읽힌다.
 * ⚠️ **`isDelayed`를 안 가져온다.** BE도 저장값이 아니라 조회 시점에 계산해 주는 값인데
 *    (`ActionSummaryResponse` 주석), 우리 카드는 이미 `isDelayed(action)`으로 마감일에서
 *    계산한다(§도메인 상수: 파생값은 상태 필드에 안 넣는다). 두 벌이 되면 서버 시각과
 *    브라우저 시각이 갈리는 자정 무렵에 배지가 서로 다른 말을 한다.
 * ⚠️ `id`를 문자열로 바꾼다 — 화면 계약(`ManagedMemberAction.id`)이 문자열이다.
 */
export function toManagedMemberAction(be: BeCompanyAction): ManagedMemberAction {
  return {
    id: String(be.id),
    title: be.title,
    status: be.status,
    dueDate: be.dueDate,
  };
}
