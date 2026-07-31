import { PLAN, type Plan } from "./types";

/**
 * 요금제 목록.
 *
 * ⚠️ **목이다.** 가격·한도가 확정되지 않았다(DECISIONS §미결정: 결제 실연동 여부).
 *    확정되면 BE에서 내려받고 이 파일은 지운다 — 컴포넌트는 `Plan`만 보므로 고칠 게 없다.
 * ⚠️ `constants/`에 두지 않는다. 확정된 도메인 상수가 아니라 아직 바뀌는 값이다.
 */
export const PLANS: readonly Plan[] = [
  {
    code: PLAN.FREE,
    name: "Free",
    price: "₩0",
    unit: "영원히 무료",
    features: ["월 10회 회의 캡처", "AI 요약 · 결정 · 액션", "구성원 5명까지"],
  },
  {
    code: PLAN.TEAM,
    name: "Team",
    price: "₩9,900",
    unit: "/ 인원 / 월 (베타 무료)",
    features: ["무제한 회의 캡처", "고급 검색 · 인수인계 · 보드", "구성원 무제한"],
    isRecommended: true,
  },
];

/** 처음 골라져 있는 플랜 — 돈이 안 드는 쪽에서 시작한다. */
export const DEFAULT_PLAN = PLAN.FREE;

/** 주 버튼 문구 — 고른 플랜에 따라 달라진다. */
export function planActionLabel(plan: Plan): string {
  return plan.code === PLAN.FREE ? `${plan.name} 플랜으로 시작하기` : `${plan.name} 플랜 결제하기`;
}
