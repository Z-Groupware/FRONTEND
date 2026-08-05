import { formatGb, formatTokens, formatWon } from "../pricing";
import type { Subscription } from "../subscription";
import type { BillingConfig } from "../types";
import { buildUsage, shouldWarnUsage, USAGE_WARN_RATIO, type UsageAxis } from "../usage";

interface UsagePanelProps {
  subscription: Subscription;
  config: BillingConfig;
  /** 오늘 `YYYY-MM-DD` — 월말 예측에 쓴다. 서버가 내려준다 */
  today: string;
}

/**
 * 이번 주기 사용량 — **돈이 왜 나가는지 보여주는 자리**다.
 *
 * ⚠️ 축은 **AI 사용량과 저장 공간 둘뿐**이다. 회의 건수는 청구와 무관해서 아래 참고 줄로 내렸다 —
 *    과금과 상관없는 숫자를 같은 크기로 놓으면 무엇 때문에 돈이 나가는지 흐려진다.
 * ⚠️ **넘겨도 막지 않는다**(팀 결정). 대신 얼마가 더 나가는지 금액으로 적는다(§정직성).
 * ⚠️ 월말 예측은 **예측이라고 밝힌다.** 단정하면 안 넘겼는데 넘긴다고 말한 셈이 된다.
 */
export function UsagePanel({ subscription, config, today }: UsagePanelProps) {
  const usage = buildUsage({
    config,
    usage: subscription.usage,
    period: {
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      today,
    },
  });

  return (
    <section className="border-border bg-card rounded-2xl border p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
          {/* 온보딩 카드 머리와 같은 표식 — 화면이 달라도 같은 서비스로 읽힌다 */}
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          이번 주기 사용량
        </h2>
        <p className="text-muted-foreground/70 text-[12px] leading-4 tabular-nums">
          {subscription.currentPeriodStart} ~ {subscription.currentPeriodEnd}
        </p>
      </div>

      <ul className="flex flex-col gap-5 pt-5">
        <li>
          <Axis axis={usage.tokens} format={formatTokens} />
        </li>
        <li>
          <Axis axis={usage.storage} format={formatGb} />
          {/*
            ⚠️ 저장 공간은 **음성과 자막을 나눠** 적는다. 둘 다 과금 대상인데,
               지울 때 음성은 권장이고 자막·요약은 비권장이라(제품 자산) 무엇이 얼마인지
               모르면 지울 수 없다.
          */}
          <p className="text-muted-foreground/70 pt-1.5 text-[11px] leading-4 tabular-nums">
            음성 {formatGb(subscription.usage.voiceStorageGb)} · 자막·요약{" "}
            {formatGb(subscription.usage.sttStorageGb)}
          </p>
        </li>
      </ul>

      <UsageBanner tokens={usage.tokens} storage={usage.storage} />
    </section>
  );
}

/**
 * 카드 아래 배너 — **알림을 띄우지 않고 여기서만 알린다**(팀 확정 2026-08-04).
 *
 * ⚠️ 회의 개설 때 경고를 띄우거나 알림을 보내지 않는다. 회의는 전 역할이 여는데
 *    정작 손쓸 수 있는 사람은 대표·Admin뿐이라, 대부분에게는 못 고치는 경고가 된다.
 *    그래서 **금액을 볼 수 있는 이 화면에만** 둔다.
 * ⚠️ **막지 않는다.** "이만큼 넘었고 금액이면 ₩X"까지만 말하고 결제로 몰지 않는다.
 * ⚠️ 넘긴 뒤에만 색을 쓴다. 80% 경고는 **문구로** 말한다 — 색은 못 보는 사람에게 사라진다.
 */
function UsageBanner({ tokens, storage }: { tokens: UsageAxis; storage: UsageAxis }) {
  const axes = [tokens, storage];
  const overAxes = axes.filter((axis) => axis.overage > 0);

  /*
    ⚠️ **이미 넘긴 경우가 먼저다.** 확정된 금액이 있는데 "넘을 것 같다"고 말하면
       아직 안 넘은 줄 안다.
  */
  if (overAxes.length > 0) {
    const total = overAxes.reduce((sum, axis) => sum + axis.overageAmount, 0);
    return (
      <p className="border-destructive/30 bg-destructive/5 mt-5 rounded-lg border px-3.5 py-3 text-[12px] leading-[18px] break-keep">
        <span className="font-semibold">
          {overAxes.map((axis) => axis.label).join(" · ")} 포함량 초과
        </span>{" "}
        지금까지 {formatWon(total)}이며, 다음 결제일에 기본료와 함께 청구됩니다.
      </p>
    );
  }

  /*
    아직 안 넘긴 경우 — **소진율을 알리고, 규칙을 말한다.**
    ⚠️ `지금 속도면 넘습니다`처럼 **예측을 단정하지 않는다.** 그건 프론트가 며칠치로 늘려 잡은
       추정이라 틀릴 수 있는데, 단정해 말하면 겁을 주는 게 된다(§정직성).
       대신 **넘기면 어떻게 되는지**를 알려 주면, 판단은 쓰는 사람이 한다.
  */
  const nearAxes = axes.filter((axis) => shouldWarnUsage(axis));

  if (nearAxes.length === 0) return null;

  return (
    <p className="border-border bg-secondary mt-5 rounded-lg border px-3.5 py-3 text-[12px] leading-[18px] break-keep">
      {/*
        ⚠️ 문턱은 **상수에서 읽는다.** `80%`라고 적어 두면 문턱을 조정할 때 띄우는 조건만
           바뀌고 문구는 옛 숫자를 말한다 — 화면이 거짓말을 하게 된다.
      */}
      {nearAxes.map((axis) => axis.label).join(" · ")} 사용량이 {USAGE_WARN_RATIO * 100}%를
      넘었습니다. 포함량을 넘기면 초과분이 다음 결제일에 기본료와 함께 추가로 청구됩니다.
    </p>
  );
}

/** 한 축 — 쓴 양 / 총량, 소진율 막대, 월말 예측 */
function Axis({ axis, format }: { axis: UsageAxis; format: (value: number) => string }) {
  const percent = Math.round(axis.ratio * 100);
  const isOver = axis.overage > 0;

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] leading-5">{axis.label}</span>
        <span className="text-[13px] leading-5 font-medium tabular-nums">
          {format(axis.used)}
          <span className="text-muted-foreground pl-1 font-normal">
            / {format(axis.included)} · {percent}%
          </span>
        </span>
      </div>

      {/*
        ⚠️ 막대는 100%에서 멈추되 **숫자는 넘긴 값을 그대로** 보여준다.
           막대까지 넘겨 그리면 칸을 뚫고 나간다.
        ⚠️ `aria-*`로 값을 읽힌다 — 막대는 눈으로만 읽는 표현이라 그대로 두면 안 보인다.
      */}
      <div
        role="progressbar"
        aria-label={`${axis.label} 소진율`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${format(axis.included)} 중 ${format(axis.used)}, ${percent}%`}
        className="bg-secondary mt-2 h-1.5 overflow-hidden rounded-full"
      >
        {/*
          ⚠️ 넘겼을 때만 색을 바꾼다. 색으로 알리는 건 에러뿐이고(§디자인 토큰),
             80% 경고는 **문구**로 말한다 — 색은 못 보는 사람에게 사라진다.
        */}
        <div
          className={
            isOver ? "bg-destructive h-full rounded-full" : "bg-foreground h-full rounded-full"
          }
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      {/*
        ⚠️ 예측에는 **금액을 적지 않는다.** 예측은 프론트가 사흘치로 늘려 잡은 추정이라
           초반일수록 크게 흔들리고, 서버가 실제로 청구하는 값과 다를 수 있다 —
           틀릴 수 있는 금액을 먼저 말하면 그게 약속이 된다(§정직성).
           **돈은 실제로 넘긴 뒤에만** 말한다(그 값은 서버가 안다).
      */}
      <p className="text-muted-foreground/70 pt-1.5 text-[11px] leading-4 tabular-nums">
        {isOver
          ? `${format(axis.overage)} 초과 · ${formatWon(axis.overageAmount)}`
          : `주기 종료 시 ${format(axis.forecast)} 예상`}
      </p>
    </>
  );
}
