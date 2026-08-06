import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Sheet, SheetContent, SheetTitle } from "./sheet";

/**
 * 화면 배율(zoom)과 팝업 위치 — **`globals.css`의 보정 규칙이 기대는 구분**을 지킨다.
 *
 * 배율을 걸면 Floating UI가 계산한 좌표에 브라우저가 배율을 한 번 더 곱해 팝업이 트리거에서
 * 떨어진다. `globals.css`가 `[data-base-ui-portal] [data-side][data-align]`에만 배율을 되돌려
 * 그걸 상쇄하는데, 그 선택자는 **두 가지 사실**에 기대고 있다.
 *
 * ⚠️ ① Floating UI Positioner는 `data-side`와 `data-align`을 **함께** 내보낸다.
 * ⚠️ ② `Sheet`는 방향별 슬라이드 애니메이션 때문에 `data-side`를 **직접** 붙이지만
 *       `data-align`은 없다. Sheet는 `fixed`로 가장자리에 붙는 물건이라 배율을 되돌리면
 *       시트가 배율만큼 커진다 — 여기 걸리면 안 된다.
 *
 * 둘 중 하나라도 깨지면 CSS는 조용히 틀린다(빌드도 테스트도 안 잡는다). 그래서 여기서 잡는다.
 */

/*
  ⚠️ **jsdom은 외부 CSS를 적용하지 않는다.** 그래서 계산된 스타일로는 규칙을 검증할 수 없다 —
     규칙 문자열을 직접 읽어 확인한다. 이게 없으면 `globals.css`에서 두 규칙을 통째로 지워도
     이 파일이 전부 통과해서, 있지도 않은 안전망을 있다고 읽게 된다.
*/
const GLOBALS_CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** 규칙이 고르는 것 — 테스트와 CSS가 **같은 문자열**을 보게 한다 */
const POSITIONER_SELECTOR = "[data-base-ui-portal] > [data-side][data-align]";

/**
 * 그 자리가 **어느 `@layer` 안인지** 알아낸다.
 *
 * ⚠️ 레이어가 곧 우선순위다(`theme < base < components < utilities`). 규칙이 다른 레이어로
 *    옮겨 가면 선언은 그대로인데 승패가 뒤집힌다 — 문자열만 확인하면 그걸 못 본다.
 * ⚠️ `globals.css`는 최상위 블록을 **열 자리 없이**(`^@layer x {` … `^}`) 쓰므로
 *    줄 머리만 보고 가른다. 중괄호를 세는 것보다 이 파일의 실제 모양에 맞다.
 */
function layerAt(css: string, index: number): string | null {
  let layer: string | null = null;
  let offset = 0;

  for (const line of css.split("\n")) {
    if (offset > index) break;

    const opened = /^@layer ([\w-]+) \{/.exec(line);
    if (opened) layer = opened[1] ?? null;
    else if (line === "}") layer = null;

    offset += line.length + 1;
  }

  return layer;
}

describe("배율 보정 규칙 자체", () => {
  it("`globals.css`에 좌표를 되돌리는 규칙과 되거는 규칙이 둘 다 있다", () => {
    expect(GLOBALS_CSS).toContain(`${POSITIONER_SELECTOR} {\n    zoom: calc(1 / var(--app-zoom));`);
    expect(GLOBALS_CSS).toContain(`${POSITIONER_SELECTOR} > * {\n    zoom: var(--app-zoom);`);
  });

  /*
    ⚠️ 자손 결합자(공백)로 되돌아가면 Popup까지 걸려 내용물이 배율을 두 번 먹는다(Z²).
       실측: 배율 150%에서 내용물이 2.25배로 그려졌다.
  */
  it("자손이 아니라 직계 자식으로 고른다", () => {
    expect(GLOBALS_CSS).not.toContain("[data-base-ui-portal] [data-side][data-align]");
  });

  /*
    ⚠️ 규칙을 `@layer utilities` 안에 두면 커스텀 유틸 블록이 끊긴다 — 실제로 한 번 그랬고
       1255줄이 `base`로 강등돼 모든 Tailwind 유틸리티에 지게 됐다.
  */
  it("`@layer utilities` 블록이 한 덩이로 남아 있다", () => {
    expect(GLOBALS_CSS.match(/^@layer utilities \{/gm)).toHaveLength(1);
  });

  /*
    ⚠️ **레이어가 곧 우선순위다.** 이 규칙은 `base`에 있어야 한다 — 화면을 그리는 값이 아니라
       배율이 걸렸을 때 좌표계를 되돌리는 **바탕 보정**이고, 컴포넌트가 붙이는 Tailwind
       유틸리티(`z-50` 등)와 다툴 일이 없어야 한다.
    ⚠️ `utilities`로 옮기면 그 블록이 끊겨 커스텀 유틸 1255줄이 `base`로 강등된다 —
       실제로 한 번 그랬다. 레이어 밖으로 나가면 아예 레이어 없는 규칙이 되어
       **모든 레이어를 이긴다.** 어느 쪽이든 선언은 그대로라 문자열 검사로는 안 잡힌다.
  */
  it.each([POSITIONER_SELECTOR, `${POSITIONER_SELECTOR} > *`])(
    "`%s` 규칙이 `@layer base` 안에 있다",
    (selector) => {
      const at = GLOBALS_CSS.indexOf(`  ${selector} {`);

      expect(at).toBeGreaterThan(-1);
      expect(layerAt(GLOBALS_CSS, at)).toBe("base");
    },
  );
});

describe("팝업 배율 보정이 기대는 데이터 속성", () => {
  it("Sheet는 `data-side`를 쓰지만 `data-align`은 없다 — 보정에 걸리면 안 된다", () => {
    render(
      <Sheet open>
        <SheetContent side="right">
          <SheetTitle>제목</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    const sheet = screen.getByRole("dialog");

    expect(sheet).toHaveAttribute("data-side", "right");
    expect(sheet).not.toHaveAttribute("data-align");
  });

  /*
    ⚠️ Positioner는 base-ui가 그리므로 **열린 상태**여야 DOM에 나온다.
       위치 계산은 여기서 검증하지 않는다 — jsdom에는 레이아웃이 없어 좌표가 전부 0이다.
  */
  function renderOpenSelect() {
    render(
      <Select defaultValue="a" open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">가</SelectItem>
        </SelectContent>
      </Select>,
    );
  }

  it("Positioner는 `data-side`와 `data-align`을 함께 내보낸다 — 규칙이 이걸로 고른다", () => {
    renderOpenSelect();

    const positioner = document.querySelector("[data-base-ui-portal] > [data-side]");

    expect(positioner).not.toBeNull();
    expect(positioner).toHaveAttribute("data-align");
  });

  /*
    ⚠️ **두 속성은 Positioner 전용이 아니다.** base-ui는 Popup에도 같은 것을 붙인다.
       그래서 규칙을 자손(공백)으로 두면 Popup까지 걸리고, Popup의 자식이 `> *`에 한 번 더
       걸려 팝업 **내용물**이 배율을 두 번 먹는다(Z²). 직계 자식(`>`)이라야 갈린다.
    ⚠️ 이 사실이 조용히 바뀌면(base-ui가 구조를 바꾸거나, 누가 Popup을 한 겹 더 감싸면)
       CSS는 아무 소리 없이 틀린다 — 그래서 **개수와 부모 관계까지** 못 박는다.
  */
  it("Popup도 같은 두 속성을 갖는다 — 그래서 자손이 아니라 직계 자식으로 골라야 한다", () => {
    renderOpenSelect();

    const both = document.querySelectorAll("[data-side][data-align]");
    const portal = document.querySelector("[data-base-ui-portal]");

    // Positioner와 Popup 둘 다다. 하나로 줄었다면 구조가 바뀐 것이라 규칙을 다시 봐야 한다
    expect(both).toHaveLength(2);

    // 규칙이 기대는 관계 — Positioner만 포털의 직계 자식이고, Popup은 그 아래다
    expect(both[0]?.parentElement).toBe(portal);
    expect(both[1]?.parentElement).toBe(both[0]);
  });

  it("규칙의 선택자는 Positioner 하나만 고른다 — Popup은 안 걸린다", () => {
    renderOpenSelect();

    const matched = document.querySelectorAll(POSITIONER_SELECTOR);

    expect(matched).toHaveLength(1);
    expect(matched[0]).not.toHaveAttribute("data-slot", "select-content");
  });
});
