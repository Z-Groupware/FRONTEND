import { DEFAULT_SCALE, parseScale, SCALE_BOOT_SCRIPT, shouldSuggestScale } from "./scale";

describe("parseScale", () => {
  it.each([
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
  */
  it.each(["9999", "0", "-1", "abc", "", "1e3"])(
    "목록에 없는 값은 기본값으로 되돌린다: %s",
    (raw) => {
      expect(parseScale(raw)).toBe(DEFAULT_SCALE);
    },
  );
});

describe("shouldSuggestScale", () => {
  const base = { devicePixelRatio: 1, viewportWidth: 2880, hasChosen: false };

  it("배율 없이 넓은 화면을 쓰면 권한다 — 글자가 절반 크기로 보이는 상황이다", () => {
    expect(shouldSuggestScale(base)).toBe(true);
  });

  it("OS가 이미 확대해 주면 안 권한다 — 맥북처럼 `dpr = 2`인 경우", () => {
    expect(shouldSuggestScale({ ...base, devicePixelRatio: 2, viewportWidth: 1440 })).toBe(false);
  });

  /*
    ⚠️ 27인치 2560×1440 모니터도 `dpr = 1`이다. 폭 문턱(2400)이 그 경계다 —
       브라우저가 화면의 물리적 크기를 안 알려줘서 이보다 정확히는 못 가른다.
  */
  it("보통 폭에서는 안 권한다 — 큰 모니터를 노트북으로 오해하면 안 된다", () => {
    expect(shouldSuggestScale({ ...base, viewportWidth: 1920 })).toBe(false);
  });

  it("**이미 고른 사람에게는 안 권한다** — 100%를 일부러 고른 사람에게 매번 권하면 잔소리다", () => {
    expect(shouldSuggestScale({ ...base, hasChosen: true })).toBe(false);
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
    localStorage.setItem("z:screen-scale", "200");

    new Function(SCALE_BOOT_SCRIPT)();

    expect(document.documentElement.style.zoom).toBe("2");
  });
});
