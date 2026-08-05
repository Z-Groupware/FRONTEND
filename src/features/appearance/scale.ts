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

/**
 * 고를 수 있는 배율 — **줄이는 쪽과 키우는 쪽이 다 있어야 한다.**
 *
 * ⚠️ 처음에 100~200만 뒀는데 틀렸다. OS 배율이 높은 기기(예: 2880×1800을 250%로 쓰는 노트북)는
 *    CSS 뷰포트가 1152라 맥북(1440)보다 **크게** 보인다 — 거기서는 줄여야 맞는다.
 *    어느 쪽으로 어긋날지는 기기마다 다르므로 양쪽을 다 연다.
 * ⚠️ 80%가 있는 이유 — 2880×1800을 250%로 쓰면 CSS 폭이 정확히 1152이고,
 *    1152 ÷ 1440 = 0.8이다. 흔한 조합이라 딱 맞는 칸을 둔다.
 * ⚠️ 200%가 있는 이유 — 같은 화면을 **배율 없이** 쓰면 CSS 폭이 2880이고 2880 ÷ 1440 = 2다.
 *    한때 목록에서 뺐다가 되돌렸다. 빼면 그 사람에게 권할 값이 150%가 되는데,
 *    그걸 눌러도 여전히 다른 기기보다 작다 — **권하는 값이 목록에 없으면 안 된다.**
 */
export const SCREEN_SCALES = [75, 80, 90, 100, 125, 150, 200] as const;

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
 * 설계 기준 폭 — 화면들이 이 폭을 전제로 그려져 있다(§디자인 토큰: 1440 기준).
 * 여기서 얼마나 벗어났는지가 곧 "다른 기기와 얼마나 다르게 보이나"다.
 */
export const REFERENCE_WIDTH = 1440;

export type ScaleHint = "none" | "smaller" | "larger";

/**
 * 배율을 **어느 쪽으로** 권할지.
 *
 * ⚠️ 한 방향만 보면 안 된다. CSS 뷰포트가 기준보다 **좁으면 크게 보이고**(OS 배율이 높다)
 *    **넓으면 작게 보인다**(배율이 없다) — 어느 쪽으로 어긋날지는 기기마다 다르다.
 * ⚠️ **이미 고른 사람에게는 안 띄운다.** 일부러 고른 사람에게 매번 권하면 잔소리다.
 * ⚠️ 문턱을 넉넉히 둔다(±25%). 1200~1800은 보통 화면이라 권할 일이 아니다 —
 *    조금만 달라도 참견하면 대부분의 사람에게 잘못된 안내가 뜬다.
 */
/**
 * 이 화면 폭에서 **기준(1440)에 가장 가까워지는** 배율.
 *
 * 지금 CSS 폭이 1152이면 1152 ÷ 1440 = 0.8 → 80%다. 배율을 걸면 화면이 그만큼 넓게
 * 계산되므로 다른 기기와 같은 폭이 된다.
 *
 * ⚠️ 목록에 있는 값 중에서 고른다. 딱 맞는 값이 없으면 **가장 가까운 것**이다 —
 *    임의의 배율을 허용하면 저장소에 이상한 값이 들어왔을 때 걸러낼 기준이 없어진다.
 */
export function recommendScale(viewportWidth: number): ScreenScale {
  if (viewportWidth <= 0) return DEFAULT_SCALE;

  const ideal = (viewportWidth / REFERENCE_WIDTH) * 100;
  return SCREEN_SCALES.reduce((best, scale) =>
    Math.abs(scale - ideal) < Math.abs(best - ideal) ? scale : best,
  );
}

export function suggestScale(input: { viewportWidth: number; hasChosen: boolean }): ScaleHint {
  if (input.hasChosen || input.viewportWidth === 0) return "none";
  // ⚠️ 경계를 포함한다. 2880을 250%로 쓰면 정확히 1152(= 1440 × 0.8)라 딱 걸린다
  if (input.viewportWidth <= REFERENCE_WIDTH * 0.8) return "smaller";
  if (input.viewportWidth > REFERENCE_WIDTH * 1.25) return "larger";
  return "none";
}

/**
 * 첫 페인트 전에 도는 부트 스크립트.
 *
 * ⚠️ **하이드레이션까지 기다리면 안 된다.** 새로고침마다 100%로 한 번 그려졌다가 확대되면서
 *    화면이 통째로 튄다 — 랜딩 밝기가 이미 같은 방식으로 `<head>`에서 처리한다.
 * ⚠️ 저장소를 못 읽어도(사생활 모드·CSP) 화면은 산다. 기본값 100%로 남을 뿐이다.
 * ⚠️ 100%면 `zoom`을 **아예 안 건다.** 빈 값으로 두면 브라우저가 계산을 한 단계 덜 한다.
 * ⚠️ 목록에 있는지를 `indexOf(s) >= 0`으로 본다. 전에는 `> 0`이었는데, 100%가 배열 첫
 *    자리라 그걸로 "100%는 건너뛴다"까지 겸했다 — 줄이는 배율이 앞에 붙자 **75%가 통째로
 *    무시됐다.** 두 판정을 섞어 쓰면 목록이 바뀔 때 조용히 틀린다.
 * ⚠️ 문자열로 넣는다. 브라우저는 숫자도 받아 주지만, 값을 다시 읽는 쪽(테스트 등)에서
 *    타입이 갈려 헷갈린다.
 * ⚠️ `--app-zoom`도 같이 세운다. `100dvh`는 배율을 모르는 값이라, 그대로 두면 화면 높이를
 *    쓰는 상자가 배율만큼 짧아지거나 넘친다 — `h-screen-z`가 이 변수로 나눠 준다.
 */
export const SCALE_BOOT_SCRIPT = `try{var s=Number(localStorage.getItem("${SCALE_STORAGE_KEY}"));if(s!==${DEFAULT_SCALE}&&[${SCREEN_SCALES.join(",")}].indexOf(s)>=0){var e=document.documentElement;e.style.zoom=String(s/100);e.style.setProperty("--app-zoom",String(s/100))}}catch(e){}`;
