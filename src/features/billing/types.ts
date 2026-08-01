/** 요금제 코드 — 화면엔 라벨을 쓰고 코드는 영문 상수로만 다룬다(CLAUDE.md §도메인 상수). */
export const PLAN = {
  FREE: "FREE",
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
  /** 표시용 가격 문자열 — 통화 기호·자릿점까지 포함한다 */
  price: string;
  /** 가격 밑에 붙는 단위 설명 */
  unit: string;
  /** 이 플랜으로 할 수 있는 것 */
  features: readonly string[];
  /** 눈에 띄게 밀어주는 플랜인지 — 배지가 붙는다 */
  isRecommended?: boolean;
}
