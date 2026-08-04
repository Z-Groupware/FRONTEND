/**
 * 요금제 코드 — 화면엔 라벨을 쓰고 코드는 영문 상수로만 다룬다(CLAUDE.md §도메인 상수).
 *
 * ⚠️ **무료 요금제는 없다**(2026-08-04 확정). 전에는 `FREE`가 있었는데, 파는 상품과
 *    "아직 결제 안 한 상태"를 같은 이름으로 부르는 바람에 화면마다 분기가 두 벌씩 생겼다.
 *    **결제 전·해지 후는 플랜이 아니라 구독 상태**다 — `SUBSCRIPTION_STATUS`를 본다.
 * ⚠️ 그래서 이 상수는 지금 값이 하나뿐이다. 그래도 지우지 않는다 — 플랜이 늘어날 때
 *    문자열을 화면에 흩어 놓지 않기 위한 자리다.
 */
export const PLAN = {
  TEAM: "TEAM",
} as const;

export type PlanCode = (typeof PLAN)[keyof typeof PLAN];

/**
 * 화면에 보여줄 요금제 한 벌.
 *
 * ⚠️ **UI 계약이다.** 컴포넌트는 이 타입만 본다 — BE 응답 모양이 정해지면
 *    매퍼가 여기에 맞춰 흡수한다(CLAUDE.md §Mock → Live 격리막).
 */
export interface Plan {
  code: PlanCode;
  /** 화면에 그대로 나가는 이름. 요금제명은 영문을 쓴다 */
  name: string;
  /*
    ⚠️ **금액은 여기 없다**(2026-08-04). 기본료·포함량·초과 단가는 전부 BE 설정
       (`BillingConfig`)에서 온다 — 실측 전 가정값이라 바뀔 것이 확정돼 있고,
       두 곳에 두면 반드시 어긋난다(팀 확정: 하드코딩 금지).
  */
  /** 이 플랜으로 할 수 있는 것 */
  features: readonly string[];
  /** 눈에 띄게 밀어주는 플랜인지 — 배지가 붙는다 */
  isRecommended?: boolean;
}
