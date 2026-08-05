import { CircleAlert } from "lucide-react";

import { formatGb, formatWon } from "@/features/billing/pricing";

import type { StorageTotals } from "../storage";

/**
 * 전체 용량 한 장.
 *
 * ⚠️ **음성과 자막·요약을 나눠 적는다.** 합계만 보여주면 무엇을 지워야 하는지 알 수 없다 —
 *    지울 수 있는 건 음성뿐이라, 그 크기를 모르면 이 화면에서 할 수 있는 일이 없다.
 * ⚠️ 게이지는 **먹색**이고 넘겼을 때만 빨강이다. 63%에 주황을 칠하면 아무 문제 없는 상태가
 *    경고로 읽힌다 — 색으로 알리는 건 에러뿐이다(CLAUDE.md §디자인 토큰).
 * ⚠️ **막지 않는다.** 넘겨도 "이만큼 넘었고 금액이면 ₩X"까지만 말하고 결제로 몰지 않는다
 *    (§요금제: 초과분은 다음 결제일에 기본료와 합산 청구).
 */
export function StorageSummary({ totals }: { totals: StorageTotals }) {
  const percent = Math.round(totals.ratio * 100);
  const isOver = totals.overageGb > 0;

  return (
    <section className="border-border bg-card rounded-2xl border p-7">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
            {/* 다른 카드 머리와 같은 표식 — 화면이 달라도 같은 서비스로 읽힌다 */}
            <span className="bg-foreground size-2 rounded-full" aria-hidden />
            전체 용량
          </h2>
          <p className="flex items-baseline gap-1.5 pt-3 tabular-nums">
            <span className="text-[30px] leading-9 font-semibold tracking-[-0.8px]">
              {formatGb(totals.usedGb)}
            </span>
            <span className="text-muted-foreground text-[15px] leading-6">
              / {formatGb(totals.includedGb)}
            </span>
          </p>
        </div>

        {/*
          ⚠️ 소진율은 **글자로** 적는다. 막대만 두면 정확히 얼마인지 읽히지 않고,
             색을 못 보는 사람에게는 막대가 통째로 사라진다.
        */}
        <p
          className={
            isOver
              ? "text-destructive shrink-0 text-[24px] leading-8 font-semibold tabular-nums"
              : "shrink-0 text-[24px] leading-8 font-semibold tabular-nums"
          }
        >
          {percent}%
        </p>
      </div>

      {/*
        ⚠️ 막대는 100%에서 멈추되 **숫자는 넘긴 값을 그대로** 보여준다.
           막대까지 넘겨 그리면 칸을 뚫고 나간다.
        ⚠️ `aria-*`로 값을 읽힌다 — 막대는 눈으로만 읽는 표현이라 그대로 두면 안 보인다.
      */}
      <div
        role="progressbar"
        aria-label="녹음 용량 소진율"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${formatGb(totals.includedGb)} 중 ${formatGb(totals.usedGb)}, ${percent}%`}
        className="bg-secondary mt-4 h-2 overflow-hidden rounded-full"
      >
        <div
          className={
            isOver ? "bg-destructive h-full rounded-full" : "bg-foreground h-full rounded-full"
          }
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      {/*
        ⚠️ **음성과 자막·요약을 나눠 적는다.** 둘 다 과금 대상인데 지울 때 성격이 다르다 —
           음성은 지워도 되는 아카이브고, 자막·요약은 회의에서 남은 결과물이다.
      */}
      <p className="text-muted-foreground/70 pt-3 text-[12px] leading-4 tabular-nums">
        음성 {formatGb(totals.voiceGb)} · 자막·요약 {formatGb(totals.sttGb)}
      </p>

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
