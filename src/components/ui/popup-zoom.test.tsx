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
       두 속성이 함께 나오는지가 이 테스트의 전부다 — 위치 계산은 여기서 검증하지 않는다
       (jsdom에는 레이아웃이 없어 좌표가 전부 0이다).
  */
  it("Select Positioner는 `data-side`와 `data-align`을 함께 내보낸다", () => {
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

    const positioner = document.querySelector("[data-side]");

    expect(positioner).not.toBeNull();
    expect(positioner).toHaveAttribute("data-align");
  });
});
