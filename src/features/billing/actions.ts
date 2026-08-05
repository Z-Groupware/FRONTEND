"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/features/shell/viewer";
import { canManageBilling } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { toFailureMessage } from "./payment";
import type { CardAuthResult } from "./payment-method";
import type { PaymentMethod } from "./subscription";

/**
 * 구독·결제의 **변경 작업**. 전부 서버에서 돈다.
 *
 * ⚠️ 브라우저 → Next서버(액션) → BE 순서다(CLAUDE.md 핵심 4원칙 ②).
 *    **토큰이 브라우저로 안 나간다** — 사내 도구라 권한이 핵심이고, 여기서 새면
 *    나머지 방어가 의미가 없다. 전에는 이 일들이 `"use client"` 모듈과 `useState`에
 *    있어서, BE를 붙이는 순간 브라우저가 BE를 직접 부르게 되어 있었다.
 * ⚠️ **액션마다 권한을 다시 본다.** 화면에서 `canManage`로 버튼을 감춘 건 UX일 뿐이고,
 *    액션은 주소만 알면 직접 부를 수 있다(§권한: 화면 숨김은 보안이 아니다).
 * ⚠️ 결제사 창을 여는 `requestCardAuth`는 **여기 없다.** 카드 번호는 그 창에서만
 *    입력되므로 브라우저에서 돌아야 한다 — 서버는 `authKey`만 받아 빌링키로 교환한다.
 * ⚠️ 아직 목이다. BE 스펙이 확정되면 각 함수의 본문만 채운다 — 부르는 쪽은 그대로다.
 */

/** 액션의 공통 결과 — 실패를 예외로 던지지 않고 값으로 돌려준다(화면이 문구를 고른다) */
export interface ActionResult {
  isSuccess: boolean;
  /** 실패 사유 한 줄. 성공이면 없다 */
  message?: string;
}

const FORBIDDEN: ActionResult = {
  isSuccess: false,
  message: "구독·결제를 변경할 권한이 없습니다",
};

/**
 * 권한 문지기 — 모든 액션이 첫 줄에서 통과해야 한다.
 *
 * ⚠️ **던지지 않는다.** 세션을 못 읽으면 `getViewer`가 예외를 내는데, 그대로 두면 액션이
 *    거절되어 화면은 결과 대신 아무것도 못 받는다 — 부르는 쪽에 `try/catch`가 없는 곳은
 *    조용히 아무 일도 안 일어난다(§정직성). 못 읽으면 **권한 없음으로 본다.**
 */
async function assertCanManage(): Promise<boolean> {
  try {
    return canManageBilling(await getViewer());
  } catch {
    return false;
  }
}

/**
 * 구독 결제를 확정한다.
 *
 * ⚠️ **성공 판정은 서버가 한다.** 결제사 응답을 서버가 받아 확인해야 하고, 화면 값을 믿으면
 *    결제하지 않고도 성공 화면을 띄울 수 있다.
 */
export async function confirmSubscriptionAction(): Promise<ActionResult> {
  if (!(await assertCanManage())) return FORBIDDEN;

  if (isMock) {
    /*
      ⚠️ 목은 항상 성공한다. **실패 화면을 보려면 여기를 잠깐 뒤집는다** —
         `return { isSuccess: false, message: toFailureMessage("EXCEED_MAX_CARD_LIMIT") }`
    */
    /*
      ⚠️ **구독 상태를 읽는 화면을 전부 갱신한다.** `/manage/billing`만 갱신하면, 결제로 상태가
         바뀌었는데 구독 재개 화면(`/subscription`)은 여전히 끊긴 화면을 보여준다 —
         둘이 같은 값을 읽는다.
    */
    revalidatePath("/manage/billing");
    revalidatePath("/subscription");
    return { isSuccess: true };
  }

  // TODO(BE 협의): `POST /companies/me/subscription/pay` → { isSuccess, failureCode }
  //   ⚠️ 받는 건 **코드**다. 화면 문구는 `toFailureMessage`가 정한다 — BE 문자열을 그대로
  //      뿌리면 `INVALID_CARD_COMPANY` 같은 게 화면에 뜬다.
  return { isSuccess: false, message: toFailureMessage() };
}

/**
 * 결제사에서 받은 인증 결과를 **빌링키로 교환**하고 저장한다.
 *
 * ⚠️ 빌링키는 **서버에만** 있다. 그 키로 결제가 일어나므로 브라우저로 내보내지 않는다.
 * ⚠️ 화면에는 표시용 정보(브랜드 · 뒤 4자리 · 만료월)만 돌려준다.
 * ⚠️ **더하는 게 아니라 갈아 끼운다.** 카드는 회사당 한 장이라, 이미 있으면 그 자리를 덮는다 —
 *    BE도 빌링키를 1:1로 들고 있어야 한다(§BE 전달 사항).
 */
export async function registerCardAction(
  auth: CardAuthResult,
): Promise<ActionResult & { method?: PaymentMethod }> {
  if (!(await assertCanManage())) return FORBIDDEN;

  if (isMock) {
    revalidatePath("/manage/billing");
    return {
      isSuccess: true,
      method: {
        id: auth.authKey,
        brand: "MASTER",
        last4: `${Math.floor(Math.random() * 9000) + 1000}`,
        expiry: "12/29",
      },
    };
  }

  // TODO(BE 협의): `POST /companies/me/payment-methods` { authKey, customerKey } → PaymentMethod
  return { isSuccess: false, message: "결제 수단을 저장하지 못했습니다" };
}

/*
  ⚠️ **기본 지정·삭제 액션을 두지 않는다.** 카드가 한 장뿐이라 기본을 고를 것도 없고,
     지우면 다음 청구가 실패하는데 대신 올릴 카드도 없다 — 바꾸는 길은 `registerCardAction`
     하나뿐이다. 그만두려면 카드를 지우는 게 아니라 **구독을 해지**한다.
*/

/**
 * 해지하거나, 해지를 되돌린다.
 *
 * ⚠️ 해지해도 **이번 주기까지는 그대로 쓴다**(`CANCELING`). 즉시 끊지 않는다.
 */
export async function toggleCancelAction(isCanceling: boolean): Promise<ActionResult> {
  if (!(await assertCanManage())) return FORBIDDEN;

  if (isMock) {
    // 해지·재개도 구독 상태를 바꾼다 — 재개 화면이 같은 값을 읽는다
    revalidatePath("/manage/billing");
    revalidatePath("/subscription");
    return { isSuccess: true };
  }

  // TODO(BE 협의): `POST /companies/me/subscription/cancel` { isCanceling }
  void isCanceling;
  return { isSuccess: false, message: "구독 상태를 바꾸지 못했습니다" };
}
