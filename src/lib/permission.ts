import "server-only";

import { ADMIN_ELIGIBLE_AUTHORITIES, AUTHORITY, type Authority } from "@/constants/domain";

/**
 * 권한 판정 — **Z는 권한 축이 2개다** (CONVENTIONS §7).
 *
 *   ① 권한(Authority)    : 화면·메뉴 접근
 *   ② 리소스 소유권      : 권한과 **무관**하게 그 문서의 담당자만
 *                         (예: 회의 시작·녹음·제출·종료·AI검토 = 그 회의 담당자 1명만.
 *                          OWNER라도 담당자가 아니면 못 한다)
 *
 * ⚠️ 화면 숨김은 UX일 뿐 보안이 아니다. Server Action·BFF에서 **반드시 이 함수로 재검사**한다.
 *    그래서 이 파일은 `server-only` — 클라이언트에서 import하면 빌드가 깨진다.
 */

/** 판정에 필요한 최소 사용자 정보. 세션(httpOnly 쿠키)에서 서버가 읽어온다. */
export interface Actor {
  id: number;
  role: Authority;
  /**
   * Admin 겸직 여부. **권한이 아니라 위에 덧붙는 권한이다** — 운영에 해당하는 일만 여기서 나온다.
   * ⚠️ **BE가 세션에 이 값을 내려줘야 한다.** `role` 하나로는 겸직을 알 수 없다.
   * ⚠️ Owner에게는 켜지지 않는다(`canGrantAdmin` 참고).
   */
  isAdmin?: boolean;
  /**
   * 소속 팀. **팀은 계층이 없는 플랫 목록**이다(백엔드 스키마 확정, 2026-08-06).
   * OWNER는 팀 소속이 아니라 `undefined`.
   * ⚠️ 팀 안의 세부 역할(프론트엔드·백엔드·리더·없음)은 별도 필드(roleId)이고
   *    이 권한 판정에는 쓰지 않는다 — 범위 판정은 teamId 하나로 끝난다.
   */
  teamId?: number;
}

/* ───────── ① 권한 축 ───────── */

/**
 * Admin 겸직 여부.
 * ⚠️ `isAdmin`을 직접 읽지 말고 이 함수를 쓴다 — Owner에게 잘못 켜진 값이 내려와도
 *    여기서 한 번 걸러진다. 권한은 조용히 새면 안 된다.
 */
function isAdmin(actor: Actor): boolean {
  return actor.isAdmin === true && canGrantAdmin(actor);
}

/**
 * 사원 관리 화면(`/manage/members`) 접근 — 계정 발급·직급/권한 변경. OWNER이거나 Admin을 겸한 사람.
 * ⚠️ **인수인계 최종 승인/반려 버튼은 이 권한과 별개**다(`canApproveFinal`, OWNER 전용) —
 *    같은 화면 안에 있어도 화면 접근과 그 버튼의 권한이 갈린다.
 */
export function canManageMembers(actor: Actor): boolean {
  return actor.role === AUTHORITY.OWNER || isAdmin(actor);
}

/**
 * 사내 공지 작성·수정 — **OWNER 전용**(2026-08-06 확정: Admin 제외).
 * ⚠️ 회사 대표가 회사 전체에 알리는 공지라는 성격이라 Admin 겸직으로는 안 연다.
 * ⚠️ 열람은 전원 가능하다(공지는 다 같이 본다) — 작성·수정만 이 권한으로 막는다.
 */
export function canManageNotice(actor: Actor): boolean {
  return actor.role === AUTHORITY.OWNER;
}

/**
 * 기업 설정(`/owner/setting`) — **OWNER 전용**.
 *
 * ⚠️ Admin 겸직으로는 안 연다. 여기서 고치는 건 사업자 정보와 **조직 체계**인데,
 *    직급의 권한이 여기서 나온다 — Admin이 직급 권한을 고칠 수 있으면 자기 위를
 *    스스로 만들 수 있다(§권한: 화면 단위로 판정한다).
 * ⚠️ `canManageMembers`와 판정이 겹치지 않게 함수를 따로 둔다 — 사원을 넣고 빼는 일과
 *    조직의 틀을 바꾸는 일은 다른 결정이다.
 */
export function canManageCompany(actor: Actor): boolean {
  return actor.role === AUTHORITY.OWNER;
}

/**
 * 구독·결제 — OWNER이거나 Admin을 겸한 사람.
 *
 * ⚠️ 이 판정 때문에 관리 기능이 `/owner/*`가 아니라 **`/manage/*`** 하나로 모여 있다
 *    (DECISIONS §관리 기능). 권한 경로에 두면 겸직자에게 주소가 거짓말을 한다.
 * ⚠️ 화면에서 버튼을 감추는 건 UX일 뿐이다 — **Server Action에서 다시 본다**.
 */
export function canManageBilling(actor: Actor): boolean {
  return actor.role === AUTHORITY.OWNER || isAdmin(actor);
}

/**
 * 녹음 용량 관리 — OWNER이거나 Admin을 겸한 사람(팀 워크플로우).
 *
 * ⚠️ `canManageBilling`과 지금은 판정이 같지만 **함수를 따로 둔다.** 용량은 돈이 아니라
 *    **데이터를 지우는 일**이라, 한쪽 정책이 바뀔 때 다른 쪽이 끌려가면 안 된다 —
 *    `role >= X` 비교가 아니라 화면·액션 단위로 판정한다(CLAUDE.md §권한).
 * ⚠️ 녹음 삭제는 되돌릴 수 없다 — **Server Action에서 다시 본다**.
 */
export function canManageStorage(actor: Actor): boolean {
  return actor.role === AUTHORITY.OWNER || isAdmin(actor);
}

/**
 * 계정 발급 — **OWNER 또는 Admin 겸직자**(2026-08-06 확정: Owner도 가능).
 * ⚠️ 전용 화면·사이드바 탭을 따로 두지 않는다 — **사원 관리(`/manage/members`) 화면 안
 *    버튼**으로 둔다. 그 화면 접근 권한(`canManageMembers`)과 발급 권한이 항상 같은 사람이라
 *    별도 함수를 만들면 두 판정이 갈릴 여지만 생긴다 — `canManageMembers`를 그대로 쓴다.
 */
export const canIssueAccount = canManageMembers;

/**
 * Admin을 켤 수 있는 대상인가 — **Owner는 겸할 수 없다**(팀 확정).
 * 사원 관리 화면의 겸직 토글과 서버 검증이 같이 쓴다.
 */
export function canGrantAdmin(target: { role: Authority }): boolean {
  return ADMIN_ELIGIBLE_AUTHORITIES.some((authority) => authority === target.role);
}

/**
 * 인수인계 **최종** 승인 — **OWNER 전용**(2026-08-06 확정: Admin 제외).
 * ⚠️ 이전엔 Admin도 됐지만, 최종 승인은 인사·조직 결정이라 대표만 하기로 정정했다.
 *    Admin은 사원 관리 화면(`canManageMembers`)엔 계속 들어가 계정 발급·직급 변경은 하되,
 *    그 화면 안의 [최종 승인/반려] 버튼만 OWNER에게만 보인다 — 화면 접근과 액션 권한이 갈린다.
 * ⚠️ 중간 승인(`canApproveMid`)은 LEADER다. 둘을 한 함수로 합치지 않는다 — 단계가 다르다.
 */
export function canApproveFinal(actor: Actor): boolean {
  return actor.role === AUTHORITY.OWNER;
}

/**
 * 팀 관리 화면 — LEADER 전용.
 * ⚠️ **OWNER는 못 들어간다**(팀 표 확정). 회사 전체는 "회사 운영" 화면에서 본다.
 */
export function canAccessTeamScope(actor: Actor): boolean {
  return actor.role === AUTHORITY.LEADER;
}

/** 프로젝트 생성 — OWNER 전용 */
export function canCreateProject(actor: Actor): boolean {
  return actor.role === AUTHORITY.OWNER;
}

/** 회의실 관리 — Admin 겸직자 전용 */
export function canManageRooms(actor: Actor): boolean {
  return isAdmin(actor);
}

/**
 * 팀 범위 안인지 — **teamId가 같은지만 본다**(백엔드 스키마 확정, 2026-08-06 단순화).
 * ⚠️ 예전엔 부서 트리 조상 경로(`departmentPath`)를 비교했지만, 팀은 계층이 없는 플랫 목록이라
 *    이제 필요 없다 — LEADER 자신의 roleId가 "리더"든 "없음"이든 무관하게 teamId만 같으면 된다.
 */
export function isWithinTeamScope(actor: Actor, target: { teamId: number }): boolean {
  return actor.teamId !== undefined && actor.teamId === target.teamId;
}

/**
 * 휴가 중간 승인 — LEADER. **자기 팀**의 사원만 대상이다(DECISIONS: 팀장 범위).
 * 대상 팀을 넘기지 않으면 권한만 본다(화면 노출 판단용). **서버 검증에서는 반드시 넘긴다.**
 */
export function canApproveMid(actor: Actor, targetTeam?: { teamId: number }): boolean {
  if (actor.role !== AUTHORITY.LEADER) return false;
  return targetTeam ? isWithinTeamScope(actor, targetTeam) : true;
}

/** 인수인계서 작성 — OWNER 제외 전원 */
export function canWriteHandover(actor: Actor): boolean {
  return actor.role !== AUTHORITY.OWNER;
}

/* ───────── ② 리소스 소유권 축 ───────── */

/**
 * 회의 조작(시작·녹음·파일 제출·종료·AI 검토) — **담당자 1명만.**
 * 권한을 보지 않는다. 이게 Z에서 가장 틀리기 쉬운 지점이다.
 */
export function canOperateMeeting(actor: Actor, meeting: { ownerId: number }): boolean {
  return actor.id === meeting.ownerId;
}

/** 액션 수행 — 배정된 본인만 */
export function canCompleteAction(actor: Actor, action: { assigneeId: number }): boolean {
  return actor.id === action.assigneeId;
}

/**
 * 회의 상세(내용·스크립트) 열람 판정에 필요한 최소 정보.
 * ⚠️ **목록과 상세는 권한이 다르다.** 목록(제목·개설 팀·프로젝트 태그)은 전 구성원 공개라
 *    통합검색 등에서 그대로 노출해도 된다 — 이 함수는 **내용(발화 기록·산출물)** 을 열 때만 쓴다.
 */
export interface MeetingVisibility {
  /** Owner가 개설한 프로젝트 회의인지(2절) — true면 팀장급 이상 전체 공개 */
  isOwnerHosted: boolean;
  /** 참석자로 지정된 사용자 id */
  attendeeIds: number[];
  /** 이 회의를 개설한 팀(팀 액션 회의) — Owner 개설 회의는 없음 */
  hostTeamId?: number;
}

/**
 * 회의 **상세** 열람 — Member는 참석자인 회의만, Leader는 참석자인 회의 + 자기 팀이 연 회의
 * + Owner가 개설한 회의(타 팀 회의는 불가), Owner는 전체(2026-08-06 확정).
 * ⚠️ 액션 상세의 "출처 회의" 링크도 이 함수로 판정한다 — 권한 없으면 잠금 표시(에러 아님).
 */
export function canViewMeetingDetail(actor: Actor, meeting: MeetingVisibility): boolean {
  if (actor.role === AUTHORITY.OWNER) return true;
  if (meeting.attendeeIds.includes(actor.id)) return true;
  if (actor.role !== AUTHORITY.LEADER) return false;
  if (meeting.isOwnerHosted) return true;
  return meeting.hostTeamId !== undefined && meeting.hostTeamId === actor.teamId;
}

/* ───────── 가드 ───────── */

/** 권한 없음. 호출부에서 잡아 403 화면(`/demo/permission`)이나 error.tsx로 보낸다. */
export class ForbiddenError extends Error {
  constructor(message = "권한이 없습니다.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Server Action 첫 줄에서 쓰는 가드.
 * @example assertPermission(canOperateMeeting(actor, meeting));
 */
export function assertPermission(allowed: boolean, message?: string): void {
  if (!allowed) throw new ForbiddenError(message);
}
