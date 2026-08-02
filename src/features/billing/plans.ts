import { PLAN, type Plan } from "./types";

/**
 * 요금제 목록.
 *
 * ⚠️ **목이다.** 가격·구성이 확정되지 않았다(DECISIONS §미결정: 결제 실연동 여부).
 *    확정되면 BE에서 내려받고 이 파일은 지운다 — 컴포넌트는 `Plan`만 보므로 고칠 게 없다.
 * ⚠️ `constants/`에 두지 않는다. 확정된 도메인 상수가 아니라 아직 바뀌는 값이다.
 *
 * **개수·용량 한도가 아니라 기능 접근으로 가른다.**
 * 한도로 가르면 화면마다 "몇 개까지 썼는지" 세고 막는 처리가 붙어 무료·유료 두 벌이 된다.
 * 접근으로 가르면 **메뉴를 열어주느냐 마느냐** 하나로 끝난다.
 *
 * ⚠️ 무엇을 잠글지는 **팀 확정 전 임시안**이다. 인수인계는 휴직·오프보딩 같은 필수 경로라
 *    잠그면 무료 사용자가 일을 못 넘기고 나간다 — 팀 확인이 필요하다.
 * ⚠️ **"AI 요약"이라고 쓰지 않는다** — 명세상 AI의 산출물은 요약문이 아니라 **액션 할당**이다.
 *    STT(자막)는 브라우저 기능이라 AI로 표기하지 않는다(CLAUDE.md §AI 기능).
 * ⚠️ 좌석(구성원 수)은 기능이 아니라 **과금 단위**다 — 결제 화면 슬라이더가 그 수를 정한다.
 */
export const PLANS: readonly Plan[] = [
  {
    code: PLAN.FREE,
    name: "Free",
    price: "₩0",
    unit: "영원히 무료",
    features: ["회의 캡처 · 실시간 자막", "통합 검색", "AI 액션 분배", "프로젝트 · 액션 관리"],
  },
  {
    code: PLAN.TEAM,
    name: "Team",
    price: "₩9,900",
    unit: "/ 인원 / 월",
    features: ["Free의 모든 기능", "인수인계 자동 취합", "회의실 예약", "보드 · 조직도"],
    isRecommended: true,
  },
];

/**
 * 처음 골라져 있는 플랜.
 * 밀어주는 플랜(Team)을 기본으로 둔다 — 배지까지 붙여 놓고 무료를 골라두면 앞뒤가 안 맞는다.
 */
export const DEFAULT_PLAN = PLAN.TEAM;

/** 주 버튼 문구 — 고른 플랜에 따라 달라진다. */
export function planActionLabel(plan: Plan): string {
  return plan.code === PLAN.FREE ? `${plan.name} 플랜으로 시작하기` : `${plan.name} 플랜 결제하기`;
}

/**
 * 플랜별 기능 비교.
 *
 * ⚠️ 위 `PLANS[].features`와 **같은 사실을 다른 모양으로** 보여준다.
 *    카드는 고를 때 쓰고, 이 표는 "무엇이 다른가"를 확인할 때 쓴다.
 *    한쪽만 고치면 두 벌이 어긋난다 — 기능을 바꿀 땐 둘 다 본다.
 */
export interface PlanCompareRow {
  feature: string;
  free: boolean;
  team: boolean;
}

export const PLAN_COMPARE: readonly PlanCompareRow[] = [
  { feature: "회의 캡처 · 실시간 자막", free: true, team: true },
  { feature: "AI 액션 분배", free: true, team: true },
  { feature: "프로젝트 · 액션 관리", free: true, team: true },
  { feature: "통합 검색", free: true, team: true },
  { feature: "인수인계 자동 취합", free: false, team: true },
  { feature: "회의실 예약", free: false, team: true },
  { feature: "보드 · 조직도", free: false, team: true },
];
