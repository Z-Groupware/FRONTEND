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

    const matched = document.querySelectorAll("[data-base-ui-portal] > [data-side][data-align]");

    expect(matched).toHaveLength(1);
    expect(matched[0]).not.toHaveAttribute("data-slot", "select-content");
  });
});
