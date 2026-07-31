import { ASSIGNABLE_ROLES, ROLE } from "@/constants/domain";

/** 부서 트리 노드. 부서는 3계층까지 쓴다(CONVENTIONS §6). */
export interface DepartmentNode {
  id: string;
  name: string;
  children: DepartmentNode[];
}

/** 부서 트리 최대 깊이 — **2계층**(상위 > 하위). DECISIONS 참고. */
export const MAX_DEPARTMENT_DEPTH = 2;

/**
 * 계층 표기는 **상위/하위 관계로만** 말한다.
 * ⚠️ 본부·팀·파트 같은 조직 용어는 기업마다 달라서 기획 확정 전까지 쓰지 않는다.
 */
const DEPTH_LABEL = ["상위", "하위"] as const;

export function getDepthLabel(depth: number): string {
  return DEPTH_LABEL[depth] ?? "하위";
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
