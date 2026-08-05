/**
 * 화면 배율 — **기기마다 다른 CSS 픽셀 밀도를 사람이 직접 맞추는 자리.**
 *
 * 같은 `13px` 글자가 맥북(dpr 2)에서는 물리 26px, 배율 100%인 윈도우 노트북(dpr 1)에서는
 * 물리 13px로 그려진다. 코드가 다르게 도는 게 아니라 자가 다르다.
 *
 * ⚠️ **자동으로 바꾸지 않는다.** `dpr === 1`이고 화면이 넓으면 확대해 주고 싶지만,
 *    27인치 데스크톱 모니터도 `dpr = 1`이다 — 브라우저는 화면의 **물리적 크기를 안 알려줘서**
 *    노트북인지 모니터인지 구분할 방법이 없다. 폭만 보고 확대하면 모니터 쓰는 사람 화면에서
 *    모든 게 우스꽝스럽게 커진다. 그래서 **감지는 하되 제안까지만** 한다.
 * ⚠️ **서버에 저장하지 않는다.** 기기 설정이라 계정을 따라다니면 안 된다 —
 *    같은 사람이 노트북과 모니터에서 다른 배율을 써야 한다.
 */

export const SCREEN_SCALES = [100, 125, 150, 200] as const;

export type ScreenScale = (typeof SCREEN_SCALES)[number];

export const DEFAULT_SCALE: ScreenScale = 100;

/** `localStorage` 키 — 랜딩 밝기(`z:landing-theme`)와 같은 규칙을 따른다 */
export const SCALE_STORAGE_KEY = "z:screen-scale";

/**
 * 저장된 값을 배율로 읽는다.
 *
 * ⚠️ 목록에 없는 값은 **기본값으로 되돌린다.** 저장소는 사람이 고칠 수 있어서
 *    `zoom: 9999` 같은 값이 들어오면 화면이 통째로 못 쓰게 된다.
 */
export function parseScale(raw: string | null): ScreenScale {
  const value = Number(raw);
  return SCREEN_SCALES.find((scale) => scale === value) ?? DEFAULT_SCALE;
}

/**
 * 배율을 **제안**할 상황인가.
 *
 * ⚠️ 두 조건을 다 만족할 때만이다.
 *    ① `dpr === 1` — OS가 확대해 주고 있지 않다
 *    ② 넓은 CSS 뷰포트 — 고해상도 화면을 배율 없이 쓰고 있다는 신호
 * ⚠️ **이미 고른 사람에게는 안 띄운다.** 100%를 일부러 고른 사람에게 매번 권하면 잔소리다.
 */
export function shouldSuggestScale(input: {
  devicePixelRatio: number;
  viewportWidth: number;
  hasChosen: boolean;
}): boolean {
  if (input.hasChosen) return false;
  return input.devicePixelRatio === 1 && input.viewportWidth >= 2400;
}

/**
 * 첫 페인트 전에 도는 부트 스크립트.
 *
 * ⚠️ **하이드레이션까지 기다리면 안 된다.** 새로고침마다 100%로 한 번 그려졌다가 확대되면서
 *    화면이 통째로 튄다 — 랜딩 밝기가 이미 같은 방식으로 `<head>`에서 처리한다.
 * ⚠️ 저장소를 못 읽어도(사생활 모드·CSP) 화면은 산다. 기본값 100%로 남을 뿐이다.
 * ⚠️ 100%면 `zoom`을 **아예 안 건다.** 빈 값으로 두면 브라우저가 계산을 한 단계 덜 한다.
 * ⚠️ 문자열로 넣는다. 브라우저는 숫자도 받아 주지만, 값을 다시 읽는 쪽(테스트 등)에서
 *    타입이 갈려 헷갈린다.
 */
export const SCALE_BOOT_SCRIPT = `try{var s=Number(localStorage.getItem("${SCALE_STORAGE_KEY}"));if([${SCREEN_SCALES.join(",")}].indexOf(s)>0)document.documentElement.style.zoom=String(s/100)}catch(e){}`;
