import {
  DEFAULT_SCALE,
  parseScale,
  recommendScale,
  SCALE_BOOT_SCRIPT,
  SCREEN_SCALES,
  suggestScale,
} from "./scale";

describe("parseScale", () => {
  it.each([
    ["75", 75],
    ["90", 90],
    ["100", 100],
    ["125", 125],
    ["150", 150],
    ["200", 200],
  ])("저장된 값을 그대로 읽는다: %s", (raw, expected) => {
    expect(parseScale(raw)).toBe(expected);
  });

  it("아직 안 고른 사람은 기본값이다", () => {
    expect(parseScale(null)).toBe(DEFAULT_SCALE);
  });

  /*
    ⚠️ **저장소는 사람이 고칠 수 있다.** 목록에 없는 값을 그대로 믿으면 `zoom: 9999`가 걸려
       화면을 통째로 못 쓰게 되고, 되돌릴 버튼도 안 보인다.
    ⚠️ `110`처럼 **그럴듯하지만 목록에 없는 값**도 걸러야 한다. 목록이 바뀌면 예전에 골라 둔
       값이 저장소에 남아 있다.
  */
  it.each(["9999", "0", "-1", "abc", "", "1e3", "110"])(
    "목록에 없는 값은 기본값으로 되돌린다: %s",
    (raw) => {
      expect(parseScale(raw)).toBe(DEFAULT_SCALE);
    },
  );
});

describe("suggestScale", () => {
  const at = (viewportWidth: number, hasChosen = false) =>
    suggestScale({ viewportWidth, hasChosen });

  /*
    ⚠️ **한 방향만 보면 안 된다.** OS 배율이 높은 기기는 CSS 뷰포트가 좁아 화면이 크게 보이고,
       배율이 없는 고해상도 기기는 넓어서 작게 보인다 — 처음엔 넓은 쪽만 보다가 틀렸다.
  */
  it("기준보다 좁으면 줄이라고 권한다 — OS 배율이 높아 크게 보이는 경우", () => {
    expect(at(1152)).toBe("smaller");
  });

  it("기준보다 넓으면 키우라고 권한다 — 배율 없이 고해상도를 쓰는 경우", () => {
    expect(at(2880)).toBe("larger");
  });

  it.each([1440, 1200, 1512, 1800])("보통 폭에서는 참견하지 않는다: %s", (width) => {
    expect(at(width)).toBe("none");
  });

  it("**이미 고른 사람에게는 안 권한다** — 일부러 고른 사람에게 매번 권하면 잔소리다", () => {
    expect(at(2880, true)).toBe("none");
  });

  it("아직 폭을 모를 때는 아무 말도 안 한다 — 서버 렌더에서는 0이다", () => {
    expect(at(0)).toBe("none");
  });
});

describe("SCALE_BOOT_SCRIPT", () => {
  /*
    ⚠️ 이 스크립트는 **첫 페인트 전에** 인라인으로 돈다. 문법이 깨지면 화면이 통째로 안 뜨는데
       빌드는 통과한다 — 문자열이라 타입 검사가 안 닿는다.
  */
  it("문법이 성립한다", () => {
    expect(() => new Function(SCALE_BOOT_SCRIPT)).not.toThrow();
  });

  it("저장소를 못 읽어도 던지지 않는다 — 사생활 모드에서도 화면은 산다", () => {
    const run = new Function(SCALE_BOOT_SCRIPT);
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("차단됨");
      },
    });

    expect(() => run()).not.toThrow();

    if (original) Object.defineProperty(globalThis, "localStorage", original);
  });

  it("100%는 `zoom`을 아예 걸지 않는다 — 쓸데없는 계산을 남기지 않는다", () => {
    localStorage.setItem("z:screen-scale", "100");
    document.documentElement.style.zoom = "";

    new Function(SCALE_BOOT_SCRIPT)();

    expect(document.documentElement.style.zoom).toBe("");
  });

  it("고른 배율을 `zoom`으로 건다", () => {
    localStorage.setItem("z:screen-scale", "150");

    new Function(SCALE_BOOT_SCRIPT)();

    expect(document.documentElement.style.zoom).toBe("1.5");
  });

  /*
    ⚠️ 목록 **첫 자리**의 값이다. 전에는 `indexOf(s) > 0`으로 걸러서 100%를 건너뛰었는데,
       줄이는 배율이 앞에 붙자 75%가 통째로 무시됐다 — 목록이 바뀌어도 안 깨지는지 본다.
  */
  it("목록 첫 값(75%)도 걸린다", () => {
    localStorage.setItem("z:screen-scale", "75");

    new Function(SCALE_BOOT_SCRIPT)();

    expect(document.documentElement.style.zoom).toBe("0.75");
  });
});

describe("recommendScale", () => {
  /*
    ⚠️ 2880×1800을 250%로 쓰면 CSS 폭이 정확히 1152다. 1152 ÷ 1440 = 0.8 →
       80%가 딱 맞는 값이라 목록에 넣어 뒀다.
  */
  it.each([
    [1152, 80],
    [1440, 100],
    [1280, 90],
    [1080, 75],
    [1800, 125],
    [2160, 150],
    [2880, 200],
  ])("폭 %s에서는 %s%%를 권한다", (width, expected) => {
    expect(recommendScale(width)).toBe(expected);
  });

  it("폭을 아직 모르면 기본값이다 — 서버 렌더에서는 0이다", () => {
    expect(recommendScale(0)).toBe(DEFAULT_SCALE);
  });

  it("아주 넓어도 목록 밖으로 나가지 않는다 — 임의 배율을 허용하면 걸러낼 기준이 없어진다", () => {
    expect(SCREEN_SCALES).toContain(recommendScale(9999));
  });

  /*
    ⚠️ **권하는 값은 반드시 목록에 있어야 한다.** 한때 200%를 목록에서 뺐더니, 배율 없이
       2880을 쓰는 사람에게 150%를 권하게 됐다 — 눌러도 여전히 다른 기기보다 작다.
  */
  it.each([1152, 1440, 2880, 1080])("권하는 값은 언제나 고를 수 있다: 폭 %s", (width) => {
    expect(SCREEN_SCALES).toContain(recommendScale(width));
  });
});
