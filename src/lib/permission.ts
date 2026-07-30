import "server-only";

import { ROLE, type Role } from "@/constants/domain";

/**
 * 권한 판정 — **Z는 권한 축이 2개다** (CONVENTIONS §7).
 *
 *   ① 역할(Role)        : 화면·메뉴 접근
 *   ② 리소스 소유권      : 역할과 **무관**하게 그 문서의 담당자만
 *                         (예: 회의 시작·녹음·제출·종료·AI검토 = 그 회의 담당자 1명만.
 *                          OWNER라도 담당자가 아니면 못 한다)
 *
 * ⚠️ 화면 숨김은 UX일 뿐 보안이 아니다. Server Action·BFF에서 **반드시 이 함수로 재검사**한다.
 *    그래서 이 파일은 `server-only` — 클라이언트에서 import하면 빌드가 깨진다.
 */

/** 판정에 필요한 최소 사용자 정보. 세션(httpOnly 쿠키)에서 서버가 읽어온다. */
export interface Actor {
  id: number;
  role: Role;
  departmentId?: number;
}

/* ───────── ① 역할 축 ───────── */

/** 사원 최종 승인·직급/권한 변경 — OWNER와 ADMIN 공통 */
export function canManageMembers(actor: Actor): boolean {
  return actor.role === ROLE.OWNER || actor.role === ROLE.ADMIN;
}

/** 계정 발급 — ADMIN만. OWNER는 발급 대상도 발급자도 아니다. */
export function canIssueAccount(actor: Actor): boolean {
  return actor.role === ROLE.ADMIN;
}

/** 구독·결제·용량·기업 설정 — OWNER 전용 */
export function canManageBilling(actor: Actor): boolean {
  return actor.role === ROLE.OWNER;
}

/** 프로젝트 생성 — OWNER 전용 */
export function canCreateProject(actor: Actor): boolean {
  return actor.role === ROLE.OWNER;
}

/** 회의실 관리 — ADMIN 전용 */
export function canManageRooms(actor: Actor): boolean {
  return actor.role === ROLE.ADMIN;
}

/** 휴가 중간 승인 — LEADER (최종 승인은 OWNER/ADMIN) */
export function canApproveMid(actor: Actor): boolean {
  return actor.role === ROLE.LEADER;
}

/** 인수인계서 작성 — OWNER 제외 전원 */
export function canWriteHandover(actor: Actor): boolean {
  return actor.role !== ROLE.OWNER;
}

/* ───────── ② 리소스 소유권 축 ───────── */

/**
 * 회의 조작(시작·녹음·파일 제출·종료·AI 검토) — **담당자 1명만.**
 * 역할을 보지 않는다. 이게 Z에서 가장 틀리기 쉬운 지점이다.
 */
export function canOperateMeeting(actor: Actor, meeting: { ownerId: number }): boolean {
  return actor.id === meeting.ownerId;
}

/** 액션 수행 — 배정된 본인만 */
export function canCompleteAction(actor: Actor, action: { assigneeId: number }): boolean {
  return actor.id === action.assigneeId;
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
