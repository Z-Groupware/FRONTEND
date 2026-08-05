"use client";

import { SCALE_STORAGE_KEY, type ScreenScale } from "./scale";

/**
 * 배율을 담는 **바깥 저장소**(`localStorage`)와 React를 잇는 자리.
 *
 * ⚠️ **구독하면 곧바로 지금 값을 한 번 알린다.** 그래야 구독하는 쪽이 효과 본문에서 값을
 *    읽지 않아도 되고(그러면 렌더가 한 번 더 돈다), 하이드레이션 직후에 저장된 값으로 맞는다.
 * ⚠️ 서버는 이 값을 모른다. 첫 렌더는 기본값으로 그려지지만 **화면은 안 튄다** —
 *    실제 확대는 첫 페인트 전에 루트 부트 스크립트가 이미 끝냈고(`SCALE_BOOT_SCRIPT`),
 *    여기서 맞추는 건 "어느 칸이 눌려 있나"뿐이다.
 */

const listeners = new Set<() => void>();

/**
 * 다른 탭에서 바뀐 것도 따라간다(`storage` 이벤트).
 * ⚠️ 같은 탭에서 바꾼 건 `storage`가 안 온다 — 그래서 `writeScale`이 직접 알린다.
 */
export function subscribeScale(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  // ⚠️ 지금 값을 한 번 알린다 — 구독하는 쪽이 효과 본문에서 저장소를 읽지 않게 한다
  queueMicrotask(onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readScale(): string | null {
  try {
    return localStorage.getItem(SCALE_STORAGE_KEY);
  } catch {
    // 사생활 모드·저장소 차단 — 기본값으로 산다
    return null;
  }
}

export function writeScale(next: ScreenScale): void {
  try {
    localStorage.setItem(SCALE_STORAGE_KEY, String(next));
  } catch {
    // 저장을 못 해도 이번 세션에는 적용된다 — 조용히 넘어가지 않고 화면은 바뀐다
  }
  listeners.forEach((notify) => notify());
}

/**
 * 화면 환경 — 배율을 **권할지** 판단할 재료.
 *
 * ⚠️ 값은 **문자열 하나**로 다룬다. 객체로 들고 다니면 매번 새 참조라 쓸데없이 다시 그린다.
 */
export function subscribeViewport(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  queueMicrotask(onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function readViewport(): string {
  return `${window.devicePixelRatio}|${window.innerWidth}`;
}
