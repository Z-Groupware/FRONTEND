import { PLAN, type Plan } from "./types";

/**
 * 요금제 목록.
 *
 * ⚠️ **목이다.** 가격·한도가 확정되지 않았다(DECISIONS §미결정: 결제 실연동 여부).
 *    확정되면 BE에서 내려받고 이 파일은 지운다 — 컴포넌트는 `Plan`만 보므로 고칠 게 없다.
 * ⚠️ `constants/`에 두지 않는다. 확정된 도메인 상수가 아니라 아직 바뀌는 값이다.
 *
 * 무엇을 무료로 열지는 **실제로 돈이 드는 축**으로 갈랐다.
 * - **AI 액션 분배** = LLM 호출. 이 서비스의 핵심이라 무료에서도 쓸 수 있어야 하지만 횟수를 막는다.
 * - **녹음 보관** = 스토리지. 회의당 파일이 크다(10분 단위 분할 업로드).
 * - **구성원 수** = 좌석 과금의 기준.
 *
 * ⚠️ **기능 자체를 잠그지 않았다.** 인수인계·보드·프로젝트·회의실은 휴직/오프보딩 같은
 *    필수 업무 경로라, 무료에서 빼면 서비스가 반쪽이 된다. 한도로만 구분한다.
 * ⚠️ **"AI 요약"이라고 쓰지 않는다** — 명세상 AI의 산출물은 요약문이 아니라 **액션 할당**이다.
 *    STT(자막)는 브라우저 기능이라 AI로 표기하지 않는다(CLAUDE.md §AI 기능).
 * ⚠️ 숫자(5회·5명·30일·1년)는 **팀 확정 전 임시값**이다.
 */
export const PLANS: readonly Plan[] = [
  {
    code: PLAN.FREE,
    name: "Free",
    price: "₩0",
    unit: "영원히 무료",
    features: [
      "회의 캡처 · 실시간 자막",
      "AI 액션 분배 월 5회",
      "구성원 5명까지",
      "녹음 보관 30일",
    ],
  },
  {
    code: PLAN.TEAM,
    name: "Team",
    price: "₩9,900",
    unit: "/ 인원 / 월 (베타 무료)",
    features: [
      "Free의 모든 기능",
      "AI 액션 분배 무제한",
      "구성원 무제한",
      "녹음 보관 1년 · 용량 확대",
    ],
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
