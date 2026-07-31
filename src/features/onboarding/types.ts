import { ASSIGNABLE_ROLES, ROLE } from "@/constants/domain";

/** 부서 트리 노드. 부서는 2계층(상위 > 하위)까지 쓴다(DECISIONS · CONVENTIONS §6). */
export interface DepartmentNode {
  id: string;
  name: string;
  children: DepartmentNode[];
}

/** 부서 트리 최대 깊이 — **2계층**(상위 > 하위). DECISIONS 참고. */
export const MAX_DEPARTMENT_DEPTH = 2;

/**
 * 트리 두 계층의 이름.
 * 윗단은 **부서**(개발팀), 아랫단은 그 안에서 맡는 **역할**(프론트엔드·백엔드)이다.
 * 역할 없이 부서에 바로 속할 수도 있다 — 팀장이 그런 경우다.
 */
const DEPTH_LABEL = ["부서", "역할"] as const;

export function getDepthLabel(depth: number): string {
  return DEPTH_LABEL[depth] ?? "역할";
}

/** 온보딩 단계 — 화면 하단 스텝퍼와 헤더 `단계 n / 3`에 함께 쓴다. */
export const ONBOARDING_STEP = {
  DEPARTMENT: 1,
  POSITION: 2,
  INVITE: 3,
} as const;
export type OnboardingStep = (typeof ONBOARDING_STEP)[keyof typeof ONBOARDING_STEP];

export const ONBOARDING_STEP_LABEL: Record<OnboardingStep, string> = {
  1: "부서 체계",
  2: "직급 체계",
  3: "사원 초대",
};

export const ONBOARDING_TOTAL_STEPS = 3;

/* ───────── 2단계 · 직급 체계 ───────── */

/**
 * 직급 한 줄. **직급명과 권한은 분리된다** — 이름은 회사마다 다르게 쓰고,
 * 권한은 이름과 무관하게 직접 고른다(Owner·Admin·Leader·Member).
 */
export interface Position {
  id: string;
  name: string;
  role: AssignableRole;
}

/** 기업이 고를 수 있는 역할. `SYSTEM`은 서비스 운영자라 제외된다. */
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

/**
 * 기업 승인 때 **시스템이 발급하는 계정.**
 * 직급 매핑 대상이 아니라, 전체 권한 구조를 보여주려고 미리보기에 고정으로 띄운다.
 */
export const SYSTEM_ISSUED_POSITIONS = [
  { name: "대표", role: ROLE.OWNER },
  { name: "관리자", role: ROLE.ADMIN },
] as const satisfies readonly { name: string; role: AssignableRole }[];

/* ───────── 3단계 · 사원 초대 ───────── */

/**
 * 초대 한 줄. 계정이 만들어지면 여기 지정한 부서·직급으로 자동 배정된다.
 * 부서는 **말단 부서만** 고를 수 있다(DECISIONS: 사원은 말단에만 소속).
 */
export interface Invite {
  id: string;
  email: string;
  /** 소속 부서(트리 윗단) */
  departmentId: string;
  /** 부서 안에서 맡는 역할(트리 아랫단). 빈 문자열이면 "없음" — 부서에 바로 속한다. */
  roleId: string;
  positionId: string;
  /** 이미 초대장이 나간 줄 — 다시 보내거나 고칠 수 없다 */
  isSent: boolean;
}

/** 초대 링크 유효 기간(일). BE 스펙 확정 시 서버 값으로 바꾼다. */
export const INVITE_LINK_VALID_DAYS = 7;
