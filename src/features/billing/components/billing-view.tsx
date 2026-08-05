"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  registerCardAction,
  removeMethodAction,
  setDefaultMethodAction,
  toggleCancelAction,
} from "../actions";
import { requestCardAuth } from "../payment-method";
import {
  type BillingOverview,
  canUseWorkspace,
  type PaymentMethod,
  SUBSCRIPTION_STATUS,
} from "../subscription";
import type { BillingConfig } from "../types";
import { CancelSubscription } from "./cancel-subscription";
import { PaymentHistoryPanel } from "./payment-history-panel";
import { PaymentMethodsPanel } from "./payment-methods-panel";
import { PlanPanel } from "./plan-panel";

interface BillingViewProps {
  config: BillingConfig;
  /** 오늘 `YYYY-MM-DD` — 사용량 예측에 쓴다 */
  today: string;
  overview: BillingOverview;
  /** 바꿀 수 있는 사람인지 — Owner이거나 Admin을 겸한 사람 */
  canManage: boolean;
}

/**
 * 구독·결제 본문 — **탭 없이 한 장**이다(2026-08-04).
 *
 * ⚠️ 처음엔 탭 셋(플랜·결제 수단·내역)이었다. 파는 플랜이 하나뿐이라 각 탭에 카드 한 장씩만
 *    있었고, 탭을 오가야 "무엇을 얼마에 어떤 카드로 내고 지난달엔 얼마였나"가 보였다 —
 *    나눌 만큼의 양이 아니면 나누지 않는 편이 낫다.
 * ⚠️ 순서가 곧 읽는 순서다: **무엇을 얼마에 → 왜 그만큼 → 어떤 카드로 → 지난 기록 → 그만두기.**
 *    해지가 맨 아래인 건 의도다 — 위에 두면 쓰는 사람이 그만두는 버튼을 먼저 만난다.
 *
 * ⚠️ 데이터는 **서버에서 받아 props로** 내려온다. 이 컴포넌트가 클라이언트인 건
 *    탭 전환과 아래 목 상태 때문이지 데이터를 가져오려는 게 아니다(§서버우선).
 * ⚠️ **상태 변경은 지금 여기 화면 안에서만 일어난다.** Server Action이 없어서다 —
 *    확인해 볼 수 있게 목으로 움직여 두되, 새로고침하면 서버 값으로 돌아간다.
 *    연동되면 이 `useState`를 지우고 액션 호출 + `revalidatePath`로 바꾼다.
 * ⚠️ 결과 토스트는 **한 줄**이다. "지금은 화면에서만 바뀐다"는 설명을 붙였더니 두 줄이 되어
 *    알약이 판처럼 커졌다 — 목이라는 사실은 연동 전 임시 상태라 화면 문구로 남길 것이 아니다.
 */
export function BillingView({ overview, config, today, canManage }: BillingViewProps) {
  const [subscription, setSubscription] = useState(overview.subscription);
  const [methods, setMethods] = useState<readonly PaymentMethod[]>(overview.methods);

  const isCanceling = subscription.status === SUBSCRIPTION_STATUS.CANCELING;

  /*
    ⚠️ 액션은 **거절될 수도 있다.** 권한·검증 실패는 값으로 오지만, 네트워크가 끊기거나
       서버가 죽으면 호출 자체가 거절된다 — 잡지 않으면 아무 일도 안 일어난 것처럼 보이고
       콘솔에만 남는다(§정직성).
  */
  const handleToggleCancel = async () => {
    const result = await toggleCancelAction(isCanceling).catch(() => null);
    if (!result?.isSuccess) {
      toast(result?.message ?? "구독 상태를 바꾸지 못했습니다");
      return;
    }
    setSubscription((prev) => ({
      ...prev,
      status: isCanceling ? SUBSCRIPTION_STATUS.ACTIVE : SUBSCRIPTION_STATUS.CANCELING,
    }));
    /*
      ⚠️ **한 줄로 끝낸다.** 언제까지 쓸 수 있는지·언제 청구되는지는 화면의 해지 카드가
         계속 보여 준다 — 사라지는 토스트에 옮겨 적으면 읽기도 전에 없어진다(DECISIONS §토스트).
    */
    toast(isCanceling ? "구독을 계속 이어갑니다" : "구독을 해지했습니다");
  };

  /*
    결제 수단 추가 — **연동 자리를 미리 갈라 뒀다**(`payment-method.ts`).
    ⚠️ 카드 정보는 이 화면을 지나가지 않는다. 결제사 창에서 인증만 받고, 빌링키는 서버가
       발급·보관한다 — 프론트가 만지면 PCI-DSS 대상이 된다.
    ⚠️ PG가 정해지면 `requestCardAuth` 한 함수만 바꾸면 되고 여기는 그대로다.
  */
  /*
    ⚠️ **던질 수 있는 호출이다.** 결제사 창을 닫거나 서버가 거절하면 `requestCardAuth`·
       `registerCardMethod`가 예외를 낸다 — 잡지 않으면 아무 일도 안 일어난 것처럼 보이고
       콘솔에만 남는다(§정직성).
    ⚠️ 여기서는 창이 아니라 토스트다. 카드 등록은 결제와 달리 **돈이 빠지지 않아서**,
       멈춰 세울 만큼의 일이 아니다(DECISIONS §토스트).
  */
  const handleAddMethod = async () => {
    try {
      /*
        ⚠️ **결제사 창만 브라우저에서 연다.** 카드 번호는 그 창에서만 입력되고, 우리는
           `authKey`만 받는다 — 빌링키로 바꾸고 저장하는 건 서버(액션)의 일이다.
        ⚠️ TODO(로그인 연동): `customerKey`는 세션의 기업 id를 쓴다 — 회사가 구독하는 단위다
      */
      const auth = await requestCardAuth("mock-company");
      const result = await registerCardAction(auth);

      if (!result.isSuccess || !result.method) {
        // ⚠️ 토스트는 한 줄(220px)이라 짧게 쓴다 — 길면 잘린다(`sonner.tsx`)
        toast(result.message ?? "결제 수단을 추가하지 못했습니다");
        return;
      }
      const added = result.method;
      setMethods((prev) => [...prev, { ...added, isDefault: prev.length === 0 }]);
      toast("결제 수단을 추가했습니다");
    } catch {
      // 결제사 창을 닫은 경우 — 여기서만 예외로 온다
      toast("결제 수단을 추가하지 못했습니다");
    }
  };

  const handleSetDefault = async (id: string) => {
    const result = await setDefaultMethodAction(id).catch(() => null);
    if (!result?.isSuccess) {
      toast(result?.message ?? "기본 결제 수단을 바꾸지 못했습니다");
      return;
    }
    setMethods((prev) => prev.map((method) => ({ ...method, isDefault: method.id === id })));
    toast("기본 결제 수단을 변경했습니다");
  };

  const handleRemoveMethod = async (id: string) => {
    const result = await removeMethodAction(id).catch(() => null);
    if (!result?.isSuccess) {
      toast(result?.message ?? "결제 수단을 지우지 못했습니다");
      return;
    }
    setMethods((prev) => prev.filter((method) => method.id !== id));
    toast("결제 수단을 삭제했습니다");
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="flex flex-col gap-7">
          <PlanPanel subscription={subscription} config={config} today={today} />
          <PaymentMethodsPanel
            methods={methods}
            canManage={canManage}
            onAdd={handleAddMethod}
            onSetDefault={handleSetDefault}
            onRemove={handleRemoveMethod}
          />
          <PaymentHistoryPanel payments={overview.payments} />
          {/* ⚠️ 아직 못 쓰는 상태(결제 전·만료)에는 해지할 게 없으니 두지 않는다 */}
          {canUseWorkspace(subscription.status) && (
            <CancelSubscription
              periodEnd={subscription.currentPeriodEnd}
              isCanceling={isCanceling}
              canManage={canManage}
              onConfirm={handleToggleCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
