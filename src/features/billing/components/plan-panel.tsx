import { formatWon } from "../pricing";
import { canUseWorkspace, type Subscription, SUBSCRIPTION_STATUS_LABEL } from "../subscription";
import type { BillingConfig } from "../types";
import { UsagePanel } from "./usage-panel";

interface PlanPanelProps {
  subscription: Subscription;
  config: BillingConfig;
  /** 오늘 `YYYY-MM-DD` — 월말 예측에 쓴다. 서버가 내려준다 */
  today: string;
  /** 바꿀 수 있는 사람인지 — Owner이거나 Admin을 겸한 사람 */
}

/**
 * 플랜 관리 탭 — 지금 무엇을 얼마에 쓰는지, 이번 달 얼마나 썼는지, 그만두려면 어떻게 하는지.
 *
 * ⚠️ 카드 모양·글자 크기는 결제 화면(`order-summary`)을 따른다 — 같은 도메인인데 결이 다르면
 *    다른 서비스처럼 보인다.
 * ⚠️ 해지는 화면 **맨 아래**다. 위에 두면 쓰는 사람이 먼저 만나게 된다.
 */
export function PlanPanel({ subscription, config, today }: PlanPanelProps) {
  /*
    ⚠️ **"무료 플랜"이 아니라 "아직/이제 못 쓰는 상태"다**(결제 전 · 만료).
       무료로 부르면 그 상태로 계속 써도 되는 것처럼 읽힌다.
  */
  const isUnpaid = !canUseWorkspace(subscription.status);

  return (
    <div className="flex flex-col gap-5">
      <section className="border-border bg-card rounded-2xl border">
        {/*
          ⚠️ 결제 화면처럼 **큰 표식을 두지 않는다.** 저기는 이름 아래 금액이 한 줄 더 있어
             40px 사각형과 균형이 맞지만, 여기는 이름 한 줄뿐이라 표식이 글자를 눌러 버린다.
             대신 다른 카드들과 **같은 점 표식**을 써서 결을 맞춘다.
        */}
        <div className="flex items-center gap-3 p-7 pb-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
                <span className="bg-foreground size-2 rounded-full" aria-hidden />
                {subscription.planName} 플랜
              </h2>
            </div>
            {/*
              ⚠️ **기능을 나열하지 않는다.** 아홉 개를 가운뎃점으로 이으면 한 줄짜리 글자
                 덩어리가 되어 아무도 안 읽는다. 여기는 이미 쓰고 있는 사람이 보는 관리 화면이라
                 무엇이 들어 있는지보다 **얼마가 언제 나가는지**가 중요하다 —
                 기능 목록은 `/plans`와 결제 화면이 맡는다.
            */}
          </div>

          {/*
            ⚠️ **결제 버튼을 두지 않는다.** 전에는 결제가 필요한 상태(`UNPAID`·`EXPIRED`)에서
               결제 화면으로 보내는 링크가 있었는데, 그 상태에서는 애초에 셸에 못 들어온다 —
               `canUseWorkspace()`가 막고 `/subscription`으로 보낸다. 즉 **아무도 못 보는
               버튼**이었다. 여기 올 수 있는 사람은 이미 이용 중이고, 고칠 값도 없다
               (좌석·주기가 사라졌다 · 2026-08-04). 그만두는 길은 아래 [구독 해지]가 맡는다.
          */}

          {/*
            ⚠️ 상태는 **글자로** 적는다. 색만으로 알리면 색을 못 보는 사람에게 사라진다
               — 색으로 알리는 건 에러뿐이다(§디자인 토큰).
            ⚠️ 제목 옆이 아니라 **오른쪽 끝**이다. 먹색 알약이 이름에 바짝 붙어 있으면
               플랜 이름보다 상태가 먼저 읽힌다 — 이름이 주인공이다.
          */}
          <span className="bg-foreground text-background shrink-0 rounded-full px-2.5 py-1 text-[11px] leading-4 font-medium">
            {SUBSCRIPTION_STATUS_LABEL[subscription.status]}
          </span>
        </div>

        {/*
          ⚠️ 지표는 **표가 아니라 칸**이다. 네 값이 나란히 서야 "지금 얼마에 쓰고 있나"가
             한 눈에 들어온다. 좁아지면 두 칸씩 접힌다.
        */}
        {/*
          ⚠️ 지표에서 **좌석·인당 요금을 뺐다**(2026-08-04). 과금이 좌석이 아니라
             기본료 + 사용량이라, 인원 숫자를 여기 두면 그게 금액을 움직이는 줄 읽힌다.
             남은 셋은 전부 **돈과 직접 이어지는 값**이다.
        */}
        <dl className="grid grid-cols-2 gap-3 px-7 pb-7 md:grid-cols-3">
          <Metric label="월 기본료" value={formatWon(config.baseFee)} />
          <Metric
            label="다음 결제일"
            value={subscription.nextBillingDate ?? "—"}
            hint={isUnpaid ? "결제 후 확정됩니다" : undefined}
          />
          <Metric
            label="다음 청구 예상"
            value={formatWon(subscription.estimatedAmount)}
            hint={
              subscription.carriedOverageAmount > 0
                ? `초과분 ${formatWon(subscription.carriedOverageAmount)} 포함`
                : undefined
            }
          />
        </dl>
      </section>

      <UsagePanel subscription={subscription} config={config} today={today} />
      {/*
        ⚠️ 해지는 **이 패널이 아니라 화면 맨 아래**에 있다(`BillingView`). 결제 수단보다 위에
           두면 쓰는 사람이 그만두는 버튼을 먼저 만난다.
      */}
    </div>
  );
}

/**
 * 지표 한 칸.
 *
 * ⚠️ 테두리 격자가 아니라 **연한 카드**다 — 결제 화면의 포함량 칸(`Included`)과 같은 모양이라,
 *    두 화면을 오갈 때 같은 종류의 값으로 읽힌다.
 */
function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-secondary/40 rounded-xl px-5 py-4">
      <dt className="text-muted-foreground text-[12px] leading-4">{label}</dt>
      <dd className="pt-1.5 text-[20px] leading-7 font-semibold tracking-[-0.4px] tabular-nums">
        {value}
      </dd>
      {hint && <p className="text-muted-foreground/70 pt-0.5 text-[11px] leading-4">{hint}</p>}
    </div>
  );
}
