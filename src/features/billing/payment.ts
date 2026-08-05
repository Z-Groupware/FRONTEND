"use client";

/**
 * 결제 요청 — **성공만 있는 게 아니다.**
 *
 * ⚠️ 실패가 흔한 흐름이다. 한도 초과·정지된 카드·해외결제 차단·인증 취소가 전부 여기로 온다 —
 *    화면이 성공 한 갈래만 들고 있으면 **아무 일도 안 일어난 것처럼** 보인다(§정직성).
 * ⚠️ 지금은 목이다 — `isMock`만 내리면 이어 붙일 수 있게 자리를 만들어 뒀다.
 *    PG는 아직 팀 미확정이다(CLAUDE.md §팀확정).
 */

const isMock = true;

/**
 * 우리가 아는 실패 사유 — **코드를 짧은 한국어 한 줄로 바꾼다.**
 *
 * ⚠️ **BE·결제사가 준 문자열을 화면에 그대로 뿌리지 않는다.** 거기서 오는 건
 *    `INVALID_CARD_COMPANY` 같은 코드이거나 길고 사무적인 문장이라, 그대로 얹으면
 *    사용자는 뭘 해야 할지 모른 채 글자만 본다.
 * ⚠️ 그래서 **아는 코드만** 옮기고 모르면 기본 문구로 내린다. 목록에 없는 코드가 자주 보이면
 *    그때 한 줄 더한다 — 모르는 걸 추측해서 적지 않는다.
 * ⚠️ **한 줄로 끝낸다.** 사유가 길어지면 창이 문단이 되고, 정작 다음에 뭘 눌러야 하는지가 묻힌다.
 */
const FAILURE_MESSAGE: Record<string, string> = {
  EXCEED_MAX_CARD_LIMIT: "카드 한도를 초과했습니다",
  INVALID_CARD_EXPIRATION: "카드 유효기간이 지났습니다",
  INVALID_STOPPED_CARD: "정지된 카드입니다",
  REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다",
  NOT_SUPPORTED_INSTALLMENT: "이 카드로는 결제할 수 없습니다",
  USER_CANCEL: "결제를 취소하셨습니다",
};

const DEFAULT_FAILURE_MESSAGE = "카드사에서 결제를 처리하지 못했습니다";

export interface PaymentResult {
  isSuccess: boolean;
  /** 실패 사유 한 줄 — 성공이면 없다 */
  message?: string;
}

/** 결제사 코드를 화면 문구로. 모르는 코드는 기본 문구다 */
function toMessage(code?: string): string {
  return (code && FAILURE_MESSAGE[code]) || DEFAULT_FAILURE_MESSAGE;
}

/**
 * 구독 결제를 요청한다.
 *
 * ⚠️ **프론트가 청구를 확정하지 않는다.** 결제 성공 판정은 서버가 결제사 응답을 받아서 한다 —
 *    화면 값을 믿으면 결제 안 하고 성공 화면을 띄울 수 있다.
 */
export async function requestSubscriptionPayment(): Promise<PaymentResult> {
  if (isMock) {
    /*
      ⚠️ 목은 항상 성공한다. **실패 화면을 보려면 여기를 잠깐 뒤집는다** —
         `return { isSuccess: false, message: toMessage("EXCEED_MAX_CARD_LIMIT") }`
    */
    return { isSuccess: true };
  }

  // TODO(BE 협의): `POST /companies/me/subscription/pay` → { isSuccess, failureCode }
  //   ⚠️ 받는 건 **코드**다. 화면 문구는 우리가 정한다 — 위 `FAILURE_MESSAGE`가 그 표다.
  return { isSuccess: false, message: toMessage() };
}
