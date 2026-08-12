/**
 * 랜딩을 **얼마나 내려왔는지**(0~1)와, 그 값으로 만드는 **연출 곡선**을 한 곳에 둔다.
 *
 * ⚠️ **상태가 아니라 상자다.** 3D는 자기 프레임 루프에서 매초 60번 값을 읽는데, 그걸 React
 *    상태로 두면 프레임마다 리렌더가 돌아 화면이 무거워진다 — 상자를 하나 두고 스크롤 쪽이
 *    쓰고, 그리는 쪽이 읽는다.
 * ⚠️ 그래서 이 값은 **렌더를 유발하지 않는다.** 읽는 쪽은 반드시 `useFrame` 같은 루프 안에서
 *    읽어야 한다.
 */
export const heroProgress = { current: 0 };

/** 0~1로 자른다 */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * 페이지 전체를 0~1로 잰다.
 *
 * ⚠️ 첫 화면 높이가 아니라 **문서 전체**를 기준으로 삼는다(2026-08-12 변경). 연출이 첫 화면에서
 *    끝나지 않고 **아래까지 이어지기** 때문이다 — 흩어졌다 모이고, 한 번 더 흩어졌다가,
 *    맨 밑에서 완성된다.
 * ⚠️ 스크롤할 곳이 없으면(짧은 화면·측정 전) 0이다. 안 막으면 `Infinity`가 나와 3D가 사라진다.
 */
export function toHeroProgress(scrollTop: number, scrollableHeight: number): number {
  if (scrollableHeight <= 0) return 0;
  return clamp01(scrollTop / scrollableHeight);
}

/**
 * 구간 안에서 **부풀었다 꺼지는** 산 하나(0 → 1 → 0).
 *
 * ⚠️ 구간 밖은 0이다 — 그래야 산 두 개를 이어 붙여도 서로 간섭하지 않는다.
 */
export function humpBetween(progress: number, from: number, to: number): number {
  if (progress <= from || progress >= to || to <= from) return 0;
  return Math.sin(((progress - from) / (to - from)) * Math.PI);
}

/**
 * 조각이 흩어진 정도 — **두 번 흩어진다.**
 *
 * ⚠️ 첫 번째는 첫 화면을 지나며(문제 제기 구간), 두 번째는 흐름 섹션을 지난 뒤다. 사이에는
 *    반드시 **0으로 완전히 모인다** — 계속 흩어져 있으면 그냥 어수선한 배경이 된다.
 * ⚠️ 마지막 구간(0.86~)에는 산을 두지 않는다. 거기서는 **완성된 모습**으로 서 있어야 한다.
 */
export function burstAt(progress: number): number {
  return Math.max(humpBetween(progress, 0, 0.26), humpBetween(progress, 0.5, 0.82));
}

/**
 * 마지막 완성 — 맨 밑에서 **한 번 번쩍이고 제자리에 선다**(0 → 1).
 *
 * ⚠️ 페이지 끝(1.0)이 아니라 조금 앞(0.86)에서 시작한다. 끝에 딱 붙여 두면 바닥에 닿기 전에는
 *    아무 일도 안 일어나고, 닿는 순간 튀어나와 놀란다.
 */
export function finaleAt(progress: number): number {
  return clamp01((progress - 0.86) / 0.14);
}
