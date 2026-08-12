"use client";

import { useEffect } from "react";

import { heroProgress, toHeroProgress } from "../hero-progress";

/**
 * 스크롤을 읽어 **첫 화면 진행도**를 채워 넣는다(그리는 일은 안 한다).
 *
 * ⚠️ **상태를 쓰지 않는다.** 스크롤은 초당 수십 번 뛰는데 그때마다 리렌더가 돌면 랜딩 전체가
 *    다시 그려진다 — 값은 상자(`heroProgress`)에 넣고, 3D가 자기 프레임 루프에서 읽어 간다.
 * ⚠️ 스크롤 주체는 `body`가 아니라 `#app-scroll`이다(화면 배율 기능 때문 — `globals.css`).
 * ⚠️ 리스너는 `passive`다. 여기서 스크롤을 막을 일이 없고, 안 붙이면 브라우저가 스크롤을
 *    한 박자 늦게 처리한다.
 */
export function HeroScrollDriver() {
  useEffect(() => {
    const scroller = document.getElementById("app-scroll");
    if (!scroller) return;

    const update = () => {
      /* ⚠️ 문서 전체 기준이다 — 연출이 첫 화면을 넘어 맨 밑까지 이어진다(§hero-progress) */
      const progress = toHeroProgress(
        scroller.scrollTop,
        scroller.scrollHeight - scroller.clientHeight,
      );
      heroProgress.current = progress;

      /*
        ⚠️ **진하기도 스크롤이 정한다.** 첫 화면에서는 Z가 주인공이라 진하게 서 있고, 내려갈수록
           물러나야 아래 섹션의 글이 먼저 읽힌다 — 고정 투명도로 두면 둘 중 하나를 포기하게 된다.
        ⚠️ CSS 변수로 쓴다. 상태로 두면 스크롤마다 랜딩 전체가 다시 그려진다.
      */
      /*
        ⚠️ **물러남은 0~1 한 값으로만 준다.** 무대(어두움·밝음)마다 진하기 범위가 다른데, 그
           계산을 여기서 하면 CSS와 두 벌이 된다 — 값은 하나, 해석은 CSS가 한다(`globals.css`의
           `.hero-z-dark`·`.hero-z-light`).
        ⚠️ 절반쯤 내려가면 다 물러난다. 그 아래는 글이 주인공이라 더 뺄 것이 없다.
      */
      document.documentElement.style.setProperty(
        "--hero-recede",
        String(Math.min(1, progress / 0.5)),
      );
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      heroProgress.current = 0;
      document.documentElement.style.removeProperty("--hero-recede");
    };
  }, []);

  return null;
}
