import { burstAt, finaleAt, isTrackLongEnough, shardMixAt, toHeroProgress } from "./hero-progress";

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

describe("shardMixAt — 바꿔치기 구간", () => {
  /*
    ⚠️ **다 모인 뒤에 바꾸지 않는다.** 그러면 격자 실루엣과 매끈한 원본이 나란히 비교되어
       "띡" 하고 바뀐 것처럼 보인다 — 한창 흩어져 있을 때 섞어야 눈이 둘을 못 견준다.
  */
  it("모여 있을 때는 매끈한 원본만 보인다", () => {
    expect(shardMixAt(0)).toBe(0);
    expect(shardMixAt(0.1)).toBe(0);
  });

  it("한창 흩어졌을 때 조각으로 완전히 넘어간다", () => {
    expect(shardMixAt(0.5)).toBe(1);
    expect(shardMixAt(1)).toBe(1);
  });

  it("가운데에서는 섞인다 — 그 구간이 넓어야 바뀌는 순간이 안 보인다", () => {
    expect(shardMixAt(0.285)).toBeCloseTo(0.5, 1);
  });
});

describe("isTrackLongEnough — 짧은 페이지에서는 연출을 끈다", () => {
  /* ⚠️ 요금제·약관처럼 한두 화면짜리에서는 흩어짐→모임이 스크롤 몇 칸에 다 지나가 어수선하다 */
  it("화면 두 개 반은 내려갈 수 있어야 켠다", () => {
    expect(isTrackLongEnough(900, 800)).toBe(false);
    expect(isTrackLongEnough(2400, 800)).toBe(true);
  });

  /* ⚠️ 화면 높이를 못 읽은 순간에는 켜지 않는다 — `x >= 0`은 늘 참이라 짧은 페이지가 켜진다 */
  it("화면 높이를 모를 때는 끈다", () => {
    expect(isTrackLongEnough(900, 0)).toBe(false);
  });
});
