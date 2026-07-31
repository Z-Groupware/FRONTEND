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
