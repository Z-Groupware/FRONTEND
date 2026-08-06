import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ScreenScaleCard } from "./screen-scale-card";

/**
 * 배율 라디오 그룹의 **키보드 계약**을 지킨다.
 *
 * ⚠️ `role="radiogroup"`이라고만 하고 방향키를 안 붙이면 스크린 리더 사용자가 배율을
 *    못 바꾼다. 탭은 선택된 칸 하나에만 멈추고(roving tabindex), 방향키로 옮긴다.
 */
describe("ScreenScaleCard 키보드", () => {
  beforeEach(() => localStorage.clear());

  const radios = () => screen.getAllByRole("radio");
  const checked = () => radios().find((r) => r.getAttribute("aria-checked") === "true");

  it("선택된 칸만 탭에 걸린다(roving tabindex)", async () => {
    render(<ScreenScaleCard />);

    // 구독이 microtask로 초기값을 알린 뒤에 본다
    await waitFor(() => expect(checked()).toBeInTheDocument());

    for (const radio of radios()) {
      const expected = radio.getAttribute("aria-checked") === "true" ? "0" : "-1";
      expect(radio).toHaveAttribute("tabindex", expected);
    }
  });

  it("오른쪽 방향키로 다음 배율을 고른다", async () => {
    const user = userEvent.setup();
    render(<ScreenScaleCard />);

    expect(checked()).toHaveTextContent("100%");

    checked()?.focus();
    await user.keyboard("{ArrowRight}");

    expect(checked()).toHaveTextContent("100%");
    // 포커스도 새 칸으로 옮겨 간다 — 안 그러면 다음 방향키가 안 먹는다
    expect(checked()).toHaveFocus();
  });

  it("왼쪽 방향키로 이전 배율을 고른다", async () => {
    const user = userEvent.setup();
    render(<ScreenScaleCard />);

    checked()?.focus();
    await user.keyboard("{ArrowLeft}");

    expect(checked()).toHaveTextContent("90%");
  });

  it("클릭으로도 고를 수 있다 — 방향키는 대체 경로다", async () => {
    const user = userEvent.setup();
    render(<ScreenScaleCard />);

    await user.click(screen.getByRole("radio", { name: "80%" }));

    expect(checked()).toHaveTextContent("80%");
  });
});
