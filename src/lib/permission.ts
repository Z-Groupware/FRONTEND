import "server-only";

import { ADMIN_ELIGIBLE_ROLES, ROLE, type Role } from "@/constants/domain";

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
  /**
   * Admin 겸직 여부. **역할이 아니라 위에 덧붙는 권한이다** — 운영에 해당하는 일만 여기서 나온다.
   * ⚠️ **BE가 세션에 이 값을 내려줘야 한다.** `role` 하나로는 겸직을 알 수 없다.
   * ⚠️ Owner에게는 켜지지 않는다(`canGrantAdmin` 참고).
   */
  isAdmin?: boolean;
  /** 소속 부서. **말단(잎) 부서만 온다** — 묶음 부서엔 사원이 붙지 않는다(DECISIONS). */
  departmentId?: number;
}

/**
 * 부서 위치. `path`는 루트부터 자기 자신까지의 id 배열이다(예: `[1, 5, 12]`).
 * ⚠️ **BE가 이 경로를 내려줘야 한다.** `departmentId` 하나로는 상·하위 관계를 알 수 없다.
 */
export interface DepartmentRef {
  id: number;
  path: number[];
}

/**
 * 대상 부서가 actor의 관리 범위(자기 부서 + 모든 하위)에 있는지.
 * 대상의 조상 경로에 actor의 부서가 들어 있으면 하위다.
 */
export function isWithinDepartmentScope(actor: Actor, target: DepartmentRef): boolean {
  if (actor.departmentId === undefined) return false;
  return target.path.includes(actor.departmentId);
}

/* ───────── ① 역할 축 ───────── */

/**
 * Admin 겸직 여부.
 * ⚠️ `isAdmin`을 직접 읽지 말고 이 함수를 쓴다 — Owner에게 잘못 켜진 값이 내려와도
 *    여기서 한 번 걸러진다. 권한은 조용히 새면 안 된다.
 */
function isAdmin(actor: Actor): boolean {
  return actor.isAdmin === true && canGrantAdmin(actor);
}

/** 사원 최종 승인·직급/권한 변경 — OWNER이거나 Admin을 겸한 사람 */
export function canManageMembers(actor: Actor): boolean {
  return actor.role === ROLE.OWNER || isAdmin(actor);
}

/**
 * 사내 공지 작성·수정 — OWNER이거나 Admin을 겸한 사람.
 * ⚠️ 열람은 전원 가능하다(공지는 다 같이 본다) — 작성·수정만 이 권한으로 막는다.
 */
export function canManageNotice(actor: Actor): boolean {
  return actor.role === ROLE.OWNER || isAdmin(actor);
}

/**
 * 구독·결제 — OWNER이거나 Admin을 겸한 사람.
 *
 * ⚠️ 이 판정 때문에 관리 기능이 `/owner/*`가 아니라 **`/manage/*`** 하나로 모여 있다
 *    (DECISIONS §관리 기능). 역할 경로에 두면 겸직자에게 주소가 거짓말을 한다.
 * ⚠️ 화면에서 버튼을 감추는 건 UX일 뿐이다 — **Server Action에서 다시 본다**.
 */
export function canManageBilling(actor: Actor): boolean {
  return actor.role === ROLE.OWNER || isAdmin(actor);
}

/** 계정 발급 — Admin 겸직자만. OWNER는 발급 대상도 발급자도 아니다. */
export function canIssueAccount(actor: Actor): boolean {
  return isAdmin(actor);
}

/**
 * Admin을 켤 수 있는 대상인가 — **Owner는 겸할 수 없다**(팀 확정).
 * 사원 관리 화면의 겸직 토글과 서버 검증이 같이 쓴다.
 */
export function canGrantAdmin(target: { role: Role }): boolean {
  return ADMIN_ELIGIBLE_ROLES.some((role) => role === target.role);
}

/**
 * 인수인계 **최종** 승인 — OWNER이거나 Admin을 겸한 사람.
 * ⚠️ 중간 승인(`canApproveMid`)은 LEADER다. 둘을 한 함수로 합치지 않는다 — 단계가 다르다.
 */
export function canApproveFinal(actor: Actor): boolean {
  return actor.role === ROLE.OWNER || isAdmin(actor);
}

/**
 * 팀 관리 화면 — LEADER 전용.
 * ⚠️ **OWNER는 못 들어간다**(팀 표 확정). 회사 전체는 "회사 운영" 화면에서 본다.
 */
export function canAccessTeamScope(actor: Actor): boolean {
  return actor.role === ROLE.LEADER;
}

/** 프로젝트 생성 — OWNER 전용 */
export function canCreateProject(actor: Actor): boolean {
  return actor.role === ROLE.OWNER;
}

/** 회의실 관리 — Admin 겸직자 전용 */
export function canManageRooms(actor: Actor): boolean {
  return isAdmin(actor);
}

/**
 * 휴가 중간 승인 — LEADER. **자기 부서 + 하위**의 사원만 대상이다(DECISIONS: 팀장 범위).
 * 대상 부서를 넘기지 않으면 역할만 본다(화면 노출 판단용). **서버 검증에서는 반드시 넘긴다.**
 */
export function canApproveMid(actor: Actor, targetDepartment?: DepartmentRef): boolean {
  if (actor.role !== ROLE.LEADER) return false;
  return targetDepartment ? isWithinDepartmentScope(actor, targetDepartment) : true;
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
