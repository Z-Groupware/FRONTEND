"use client";

import { isMock } from "@/mocks/config";

/**
 * 결제 수단 등록 — **카드 정보는 우리 화면을 지나가지 않는다.**
 *
 * 실제 흐름(Toss 기준):
 * 1. 화면이 결제사 창을 띄운다 — 카드 번호는 **거기서만** 입력된다
 * 2. 결제사가 `authKey`를 준다 (아직 결제 수단이 아니다)
 * 3. **서버**가 `authKey` + `customerKey`로 빌링키를 발급받아 저장한다
 * 4. 서버가 표시용 정보(브랜드 · 뒤 4자리 · 만료월)만 내려 주고, 화면은 그걸 그린다
 *
 * ⚠️ **프론트는 카드 번호를 받지도 보내지도 않는다.** 우리가 만지면 PCI-DSS 대상이 된다.
 *    `PaymentMethod`에 `last4`만 있는 이유다.
 * ⚠️ **빌링키를 프론트가 들고 있지 않는다.** 그 키로 결제가 일어나므로 서버에만 있어야 한다.
 * ⚠️ **이 파일만 브라우저에서 돈다.** 결제사 창을 여는 일이라 서버로 옮길 수 없다 —
 *    빌링키 발급·저장은 서버(`actions.ts`)가 한다.
 * ⚠️ 지금은 목이다 — `isMock`만 내리면 아래 주석대로 이어 붙일 수 있게 자리를 만들어 뒀다.
 *    PG는 아직 팀 미확정이다(CLAUDE.md §팀확정 — 결제 실연동 여부).
 */

/**
 * 결제사 창에서 카드 등록을 받고 **인증 결과**를 돌려준다.
 * 이 값 자체로는 결제가 안 된다 — 서버가 빌링키로 바꿔야 한다.
 */
export interface CardAuthResult {
  /** 결제사가 준 1회용 인증키. 서버가 빌링키로 교환한다 */
  authKey: string;
  /** 우리 쪽 고객 식별자 — **기업 id를 쓴다**(사람이 아니라 회사가 구독한다) */
  customerKey: string;
}

/**
 * 결제사 창을 띄워 카드 등록을 받는다.
 *
 * ⚠️ **Toss로 정해지면 여기 한 함수만 바꾸면 된다.** 부르는 쪽(`billing-view`)은 그대로다.
 *
 * ```ts
 * // 실연동 시 — @tosspayments/tosspayments-sdk
 * const toss = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
 * const payment = toss.payment({ customerKey });
 * await payment.requestBillingAuth({
 *   method: "CARD",
 *   successUrl: `${location.origin}/billing/methods/callback`,
 *   failUrl: `${location.origin}/billing?method=fail`,
 * });
 * // 성공 URL로 되돌아오면 쿼리의 authKey를 서버로 넘긴다
 * ```
 *
 * ⚠️ Toss는 **리다이렉트**로 돌아온다 — 그래서 이 함수가 값을 바로 돌려주는 모양은
 *    실연동 때 콜백 라우트로 바뀐다. 지금 목은 흐름만 확인하려고 값을 바로 준다.
 */
export async function requestCardAuth(customerKey: string): Promise<CardAuthResult> {
  if (isMock) {
    return { authKey: `mock_auth_${Date.now()}`, customerKey };
  }

  // TODO(PG 확정): 위 주석의 Toss 호출로 바꾼다.
  throw new Error("결제사가 연결되지 않았습니다");
}
