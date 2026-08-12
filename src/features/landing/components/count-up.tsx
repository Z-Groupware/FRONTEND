"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * 숫자가 **0부터 굴러 올라온다**.
 *
 * ⚠️ **마운트될 때 센다.** 흐름 섹션의 축소판은 그 단계가 열릴 때마다 새로 마운트되므로
 *    (`flow-section.tsx`의 `key`), 따로 신호를 주고받을 필요 없이 조립과 함께 시작한다.
 * ⚠️ **서버가 그린 값은 최종값이다.** 0부터 그리면 자바스크립트가 죽었을 때 영영 0으로 남고,
 *    검색 로봇도 0을 읽는다 — 시작값은 화면에 붙은 뒤에만 낮춘다(§정직성).
 * ⚠️ **모션을 줄여 달라는 사람에게는 안 센다.** 숫자가 튀는 건 어지럼을 유발한다.
 * ⚠️ `tabular-nums`는 부르는 쪽이 준다 — 안 주면 세는 동안 폭이 흔들려 옆 글자가 밀린다.
 */
export function CountUp({ value, duration = 0.9 }: { value: number; duration?: number }) {
  const prefersReduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  /** 세는 동안만 화면 값을 낮춘다 — 첫 렌더는 언제나 최종값이다 */
  const started = useRef(false);

  useEffect(() => {
    if (prefersReduced || started.current) return;
    started.current = true;

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setShown(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value, duration, prefersReduced]);

  return <>{shown}</>;
}
