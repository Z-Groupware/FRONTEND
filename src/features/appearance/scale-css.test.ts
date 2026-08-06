import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 화면 배율이 **`transform: scale()`로 걸리는지**를 지킨다(2026-08-06 전환).
 *
 * 전에는 `zoom`으로 걸었는데, `zoom`은 배율을 **레이아웃 계산에 섞어** 좌표를 다루는 코드를
 * 전부 어긋나게 했다. base-ui가 쓰는 Floating UI는 `zoom`이라는 낱말을 아예 모르고
 * `transform: scale`만 `getScale`로 보정한다 — 그 탓에 세 가지가 연달아 터졌다:
 *
 *   ① 팝업이 트리거에서 배율만큼 떨어진다
 *   ② 클릭을 막는 층의 구멍이 어긋나 트리거가 덮인다
 *   ③ 기준 상자가 갈려 팝업이 화면 밖에 그려진다
 *
 * 셋 다 `zoom`을 걷어내면 사라진다. 그래서 **`zoom`으로 되돌아가는 것**을 여기서 막는다.
 *
 * ⚠️ jsdom은 외부 CSS를 적용하지 않아 계산된 스타일로는 검증할 수 없다 — 규칙 문자열을
 *    직접 읽는다. 이게 없으면 누가 `body`의 배율 적용을 지워도 아무도 모른다.
 */
const GLOBALS_CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("화면 배율 적용 방식", () => {
  it("`body`가 `transform: scale()`로 배율을 건다", () => {
    expect(GLOBALS_CSS).toContain("transform: scale(var(--app-scale));");
    expect(GLOBALS_CSS).toContain("transform-origin: 0 0;");
  });

  /*
    ⚠️ `transform`은 **레이아웃 크기를 안 바꾼다.** 미리 키워 두지 않으면 줄어든 만큼
       오른쪽·아래가 빈다.
  */
  it("줄어든 만큼 미리 키워 둔다", () => {
    expect(GLOBALS_CSS).toContain("width: calc(100% / var(--app-scale));");
    expect(GLOBALS_CSS).toContain("height: calc(100% / var(--app-scale));");
  });

  /*
    ⚠️ **`html`이 아니라 `body`여야 한다.** base-ui 포털이 `body`에 붙으므로, 여기 걸어야
       트리거와 팝업이 같은 배율 공간에 있게 되고 Floating UI 계산이 맞는다.
  */
  it("배율을 거는 자리는 `body`다", () => {
    const body = GLOBALS_CSS.slice(GLOBALS_CSS.indexOf("\n  body {"));
    const rule = body.slice(0, body.indexOf("\n  }"));

    expect(rule).toContain("transform: scale(var(--app-scale));");
  });

  /*
    ⚠️ **`zoom`으로 돌아가면 안 된다.** 세 가지 좌표 버그가 전부 거기서 나왔다.
  */
  it("`zoom`을 쓰지 않는다", () => {
    expect(GLOBALS_CSS).not.toContain("zoom:");
  });

  /*
    ⚠️ 배율 보정 해킹(`[data-base-ui-portal]`에 `zoom`을 되걸던 것)은 전부 걷어냈다.
       `transform: scale`은 Floating UI가 스스로 보정하므로 그런 덧칠이 필요 없다.
  */
  it("팝업에 배율을 되거는 덧칠이 남아 있지 않다", () => {
    expect(GLOBALS_CSS).not.toContain("data-base-ui-portal");
  });
});
