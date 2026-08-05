import type { StorageTotals } from "../storage";

/**
 * 용량 링 — **얼마나 찼는지 한눈에 느끼게 하는 그림.**
 *
 * ⚠️ 막대 하나로는 63%가 여유인지 빠듯한지 잘 안 잡힌다. 원은 **한 바퀴가 곧 전부**라
 *    남은 조각이 크기로 바로 보인다.
 * ⚠️ 두 조각(음성 · 자막·요약)을 **이어 그린다.** 지울 수 있는 건 음성뿐이라, 그 조각이
 *    얼마나 큰지가 곧 "지워서 얼마나 벌 수 있나"다.
 * ⚠️ 색이 아니라 **명도**로 나눈다 — 색으로 알리는 건 에러뿐이고, 넘겼을 때만 빨강이 된다
 *    (§디자인 토큰).
 * ⚠️ **그림은 보조다.** 정확한 값은 옆의 숫자가 말하고 링은 `aria-hidden`이다 —
 *    링만으로 값을 읽히려 하면 스크린 리더에서 사라진다.
 */
export function StorageGauge({ totals }: { totals: StorageTotals }) {
  const isOver = totals.overageGb > 0;

  /*
    ⚠️ 비율은 **포함량 기준**이고 합쳐서 1을 넘지 않게 자른다. 넘긴 만큼까지 그리면
       링이 두 바퀴를 돌아 무엇이 얼마인지 알 수 없다 — 초과는 숫자와 배너가 말한다.
  */
  const scale = totals.includedGb > 0 ? 1 / totals.includedGb : 0;
  const voiceRatio = Math.min(1, totals.voiceGb * scale);
  const sttRatio = Math.min(1 - voiceRatio, totals.sttGb * scale);

  // r=52 원의 둘레. 조각 길이를 `stroke-dasharray`로 잘라 쓴다
  const CIRCUMFERENCE = 2 * Math.PI * 52;

  return (
    <svg viewBox="0 0 120 120" className="size-[132px] shrink-0 -rotate-90" aria-hidden>
      {/* 남은 자리 — 링의 바탕 */}
      <circle cx="60" cy="60" r="52" fill="none" strokeWidth="12" className="stroke-secondary" />

      {/* 자막·요약 — 음성 뒤에 이어 붙는다 */}
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        strokeWidth="12"
        strokeDasharray={`${(voiceRatio + sttRatio) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        className={isOver ? "stroke-destructive/45" : "stroke-foreground/35"}
      />

      {/* 음성 — 12시부터. 지울 수 있는 쪽이라 제일 진하다 */}
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${voiceRatio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        className={isOver ? "stroke-destructive" : "stroke-foreground"}
      />
    </svg>
  );
}
