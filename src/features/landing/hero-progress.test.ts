import { toHeroProgress } from "./hero-progress";

/**
 * 첫 화면 진행도 — **연출 전체가 이 값 하나로 움직인다.**
 * 범위를 벗어나면 3D가 뒤집히거나 조각이 화면 밖으로 날아간다.
 */
describe("toHeroProgress", () => {
  it("화면 높이의 배수로 잰다 — 모니터가 커도 연출 속도가 같다", () => {
    /* 1.6화면이 기준이라 800px 화면에서는 1280px를 내려가야 끝난다 */
    expect(toHeroProgress(640, 800)).toBeCloseTo(0.5);
    expect(toHeroProgress(1280, 800)).toBe(1);
  });

  it("맨 위에서는 0이다", () => {
    expect(toHeroProgress(0, 800)).toBe(0);
  });

  /* ⚠️ 되올리거나(음수) 한참 내려가도 범위를 안 벗어난다 */
  it("위아래로 벗어나지 않는다", () => {
    expect(toHeroProgress(-500, 800)).toBe(0);
    expect(toHeroProgress(99999, 800)).toBe(1);
  });

  /* ⚠️ 화면 높이를 아직 못 읽은 순간(0)에 나누면 `Infinity`가 나와 3D가 사라진다 */
  it("화면 높이를 모를 때는 0으로 둔다", () => {
    expect(toHeroProgress(300, 0)).toBe(0);
  });
});
