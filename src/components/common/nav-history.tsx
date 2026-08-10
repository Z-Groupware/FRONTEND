"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 이 탭에서 **앱 안을 한 번이라도 이동했는지**.
 *
 * ⚠️ 모듈 변수다 — 새로고침하면 초기화된다. 그게 맞다: 새로고침 뒤의 "뒤로"는 같은 화면으로
 *    돌아가는 것이라 이력이 없는 것과 같다.
 * ⚠️ `history.state.idx`를 쓰지 않는다. Next 16의 상태에는 그 값이 없다(내부 트리만 들어 있다) —
 *    실측으로 확인했다.
 */
let hasNavigated = false;

/** 앱 밖에서 들어왔는지 — 우리 주소에서 넘어왔으면 뒤로 갈 곳이 있다 */
function cameFromSameOrigin(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.referrer) && document.referrer.startsWith(window.location.origin);
}

/** 뒤로가기가 **왔던 길**로 갈 수 있는 상태인지 */
export function hasInAppHistory(): boolean {
  return hasNavigated || cameFromSameOrigin();
}

/**
 * 경로가 바뀔 때마다 표시를 남기는 잎사귀 — 화면에는 아무것도 안 그린다.
 *
 * ⚠️ **첫 렌더는 세지 않는다.** 그 화면에 막 들어온 것이지 이동한 게 아니다 — 주소로 바로
 *    들어온 사람에게 뒤로가기가 앱 밖으로 나가 버리면 안 된다.
 */
export function NavHistoryTracker() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    hasNavigated = true;
  }, [pathname]);

  return null;
}
