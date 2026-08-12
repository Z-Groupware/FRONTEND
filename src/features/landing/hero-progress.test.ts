import { burstAt, finaleAt, toHeroProgress } from "./hero-progress";

/**
 * 첫 화면 진행도 — **연출 전체가 이 값 하나로 움직인다.**
 * 범위를 벗어나면 3D가 뒤집히거나 조각이 화면 밖으로 날아간다.
 */
describe("toHeroProgress", () => {
  /* ⚠️ 문서 전체가 기준이다 — 연출이 첫 화면에서 끝나지 않고 맨 밑까지 이어진다 */
  it("스크롤할 수 있는 거리를 0~1로 잰다", () => {
    expect(toHeroProgress(2000, 4000)).toBeCloseTo(0.5);
    expect(toHeroProgress(4000, 4000)).toBe(1);
  });

  it("맨 위에서는 0이다", () => {
    expect(toHeroProgress(0, 4000)).toBe(0);
  });

  /* ⚠️ 되올리거나(음수) 한참 내려가도 범위를 안 벗어난다 */
  it("위아래로 벗어나지 않는다", () => {
    expect(toHeroProgress(-500, 4000)).toBe(0);
    expect(toHeroProgress(99999, 4000)).toBe(1);
  });

  /* ⚠️ 화면 높이를 아직 못 읽은 순간(0)에 나누면 `Infinity`가 나와 3D가 사라진다 */
  /* ⚠️ 스크롤할 곳이 없으면(짧은 화면·측정 전) 나눗셈이 `Infinity`가 되어 3D가 사라진다 */
  it("스크롤할 거리가 없으면 0으로 둔다", () => {
    expect(toHeroProgress(300, 0)).toBe(0);
  });
});

describe("burstAt — 두 번 흩어진다", () => {
  /* ⚠️ 사이에서 **완전히 모여야** 한다. 계속 벌어져 있으면 그냥 어수선한 배경이 된다 */
  it("맨 위·중간·맨 밑에서는 모여 있다", () => {
    expect(burstAt(0)).toBe(0);
    expect(burstAt(0.4)).toBe(0);
    expect(burstAt(1)).toBe(0);
  });

  it("첫 화면과 흐름 뒤, 두 번 벌어진다", () => {
    expect(burstAt(0.13)).toBeGreaterThan(0.9);
    expect(burstAt(0.66)).toBeGreaterThan(0.9);
  });
});

describe("finaleAt — 맨 밑에서 완성", () => {
  it("끝에 닿기 전에 시작해 바닥에서 끝난다", () => {
    expect(finaleAt(0.85)).toBe(0);
    expect(finaleAt(0.93)).toBeCloseTo(0.5);
    expect(finaleAt(1)).toBe(1);
  });
});
