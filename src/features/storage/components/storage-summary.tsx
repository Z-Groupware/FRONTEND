import { CircleAlert } from "lucide-react";

import { formatGb, formatWon } from "@/features/billing/pricing";

import type { StorageTotals } from "../storage";
import { StorageGauge } from "./storage-gauge";

/**
 * 전체 용량 한 장.
 *
 * ⚠️ **링으로 그린다.** 막대 하나로는 63%가 여유인지 빠듯한지 잘 안 잡힌다 —
 *    원은 한 바퀴가 곧 전부라 남은 조각이 크기로 바로 보인다.
 * ⚠️ 두 조각(음성 / 자막·요약)을 갈라 그린다. 한 덩어리로 그리면 어느 쪽이 자리를
 *    차지하는지 안 보이는데, 지울 수 있는 건 음성뿐이라 그 비율이 곧 "지워서 얼마나 벌 수
 *    있나"다. 숫자로만 적어 두면 두 값을 머릿속에서 비교해야 한다.
 * ⚠️ 두 조각은 **색이 아니라 명도**로 나눈다. 색으로 알리는 건 에러뿐이다(§디자인 토큰) —
 *    넘겼을 때만 막대가 빨강이 된다.
 * ⚠️ **막지 않는다.** 넘겨도 "이만큼 넘었고 금액이면 ₩X"까지만 말하고 결제로 몰지 않는다
 *    (§요금제: 초과분은 다음 결제일에 기본료와 합산 청구).
 */
export function StorageSummary({ totals }: { totals: StorageTotals }) {
  const percent = Math.round(totals.ratio * 100);
  const isOver = totals.overageGb > 0;

  return (
    <section className="border-border bg-card rounded-2xl border p-7">
      <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
        {/* 다른 카드 머리와 같은 표식 — 화면이 달라도 같은 서비스로 읽힌다 */}
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        전체 용량
      </h2>

      {/*
        ⚠️ 링과 숫자를 **나란히** 둔다. 링만 있으면 정확한 값을 못 읽고, 숫자만 있으면
           얼마나 남았는지가 안 느껴진다 — 둘이 같은 줄에 있어야 한 번에 읽힌다.
      */}
      <div className="flex items-center gap-8 pt-6">
        <span className="relative shrink-0">
          <StorageGauge totals={totals} />
          {/*
            ⚠️ 소진율은 **링 한가운데 글자로** 적는다. 그림만 두면 정확히 얼마인지 읽히지
               않고, 색을 못 보는 사람에게는 링이 통째로 사라진다.
          */}
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={
                isOver
                  ? "text-destructive text-[24px] leading-8 font-semibold tabular-nums"
                  : "text-[24px] leading-8 font-semibold tabular-nums"
              }
            >
              {percent}%
            </span>
            <span className="text-muted-foreground/70 text-[11px] leading-4">
              {isOver ? "초과" : "사용"}
            </span>
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="flex items-baseline gap-1.5 tabular-nums"
            role="progressbar"
            aria-label="녹음 용량 소진율"
            aria-valuenow={Math.min(100, percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${formatGb(totals.includedGb)} 중 ${formatGb(totals.usedGb)}, ${percent}%. 음성 ${formatGb(totals.voiceGb)}, 자막·요약 ${formatGb(totals.sttGb)}`}
          >
            <span className="text-[34px] leading-10 font-semibold tracking-[-1px]">
              {formatGb(totals.usedGb)}
            </span>
            <span className="text-muted-foreground text-[15px] leading-6">
              / {formatGb(totals.includedGb)}
            </span>
          </p>

          {/*
            ⚠️ **남았는지 넘겼는지**를 글자로 적는다. 퍼센트만 있으면 63%가 여유인지
               빠듯한지 판단할 기준이 없다.
          */}
          <p className="text-muted-foreground pt-1 text-[13px] leading-5 tabular-nums">
            {isOver
              ? `${formatGb(totals.overageGb)} 넘었습니다`
              : `${formatGb(totals.includedGb - totals.usedGb)} 남았습니다`}
          </p>

          {/*
            ⚠️ 범례는 **링 조각과 같은 명도**를 쓴다. 다른 회색을 쓰면 어느 점이 어느 조각인지
               맞춰 보게 된다.
            ⚠️ 이름 옆에 **성격**을 적는다. 두 값의 크기만 알려 주면 어느 쪽을 지워야 하는지는
               여전히 모른다 — 이 화면의 답이 거기 있다.
          */}
          <dl className="flex flex-col gap-1.5 pt-4">
            <Legend
              label="음성"
              value={formatGb(totals.voiceGb)}
              dotClassName={isOver ? "bg-destructive" : "bg-foreground"}
              hint="지울 수 있습니다"
            />
            <Legend
              label="자막·요약"
              value={formatGb(totals.sttGb)}
              dotClassName={isOver ? "bg-destructive/45" : "bg-foreground/35"}
              hint="회의에서 남은 기록입니다"
            />
          </dl>
        </div>
      </div>

      {isOver && (
        /*
          ⚠️ 넘긴 뒤에만 뜬다. 80% 경고는 구독·결제 화면이 맡는다 — 같은 말을 두 화면에서
             하면 한쪽 문턱만 바뀌었을 때 서로 다른 숫자를 말하게 된다.
        */
        <p className="border-destructive/30 bg-destructive/5 mt-5 flex items-start gap-2 rounded-lg border px-3.5 py-3 text-[12px] leading-[18px] break-keep">
          <CircleAlert className="text-destructive mt-px size-3.5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">{formatGb(totals.overageGb)} 초과</span> 지금까지{" "}
            {formatWon(totals.overageAmount)}이며, 다음 결제일에 기본료와 함께 청구됩니다. 녹음을
            지우면 다음 주기부터 줄어듭니다.
          </span>
        </p>
      )}
    </section>
  );
}

/** 범례 한 줄 — 점 · 이름 · 값 · 성격 */
function Legend({
  label,
  value,
  dotClassName,
  hint,
}: {
  label: string;
  value: string;
  dotClassName: string;
  hint: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`${dotClassName} size-2 shrink-0 translate-y-[-2px] rounded-full`}
        aria-hidden
      />
      <dt className="text-[13px] leading-5">{label}</dt>
      <dd className="text-[13px] leading-5 font-medium tabular-nums">{value}</dd>
      <span className="text-muted-foreground/70 text-[11px] leading-5">{hint}</span>
    </div>
  );
}
