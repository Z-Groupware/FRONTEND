/**
 * 첫 화면을 **얼마나 지났는지**(0~1) 한 곳에 둔다.
 *
 * ⚠️ **상태가 아니라 상자다.** 3D는 자기 프레임 루프에서 매초 60번 값을 읽는데, 그걸 React
 *    상태로 두면 프레임마다 리렌더가 돌아 화면이 무거워진다 — 상자를 하나 두고 스크롤 쪽이
 *    쓰고, 그리는 쪽이 읽는다.
 * ⚠️ 그래서 이 값은 **렌더를 유발하지 않는다.** 읽는 쪽은 반드시 `useFrame` 같은 루프 안에서
 *    읽어야 한다.
 */
export const heroProgress = { current: 0 };

/**
 * 첫 화면이 차지하는 스크롤 길이 — 이 거리를 다 내려가면 진행도가 1이다.
 *
 * ⚠️ 화면 높이의 배수로 잡는다. 픽셀로 못 박으면 노트북과 큰 모니터에서 연출 속도가 달라진다.
 */
export const HERO_TRACK_SCREENS = 1.6;

/** 0~1로 자른다 — 위로 되올리거나 한참 내려가도 연출이 범위를 벗어나지 않는다 */
export function toHeroProgress(scrollTop: number, viewportHeight: number): number {
  const span = viewportHeight * HERO_TRACK_SCREENS;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, scrollTop / span));
}
