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

/**
 * 우리 주소에서 넘어왔고, **그 탭에 실제로 뒤로 갈 자리가 있는지**.
 *
 * ⚠️ **`startsWith`로 비교하지 않는다.** 경계 검사가 없어서 `https://z.example`이
 *    `https://z.example.evil.com`에도 걸린다 — 밖에서 들어온 사람을 "앱 안에서 왔다"고
 *    판정하면 뒤로가기가 그 바깥 사이트로 되돌아간다. `URL`로 파싱해 origin을 통째로 맞춘다.
 * ⚠️ **`history.length`를 함께 본다.** referrer가 우리 주소라고 뒤로 갈 자리가 있는 건
 *    아니다 — ⌘·가운데 클릭으로 새 탭에 열면 referrer는 그대로 넘어오지만 그 탭의 이력은
 *    한 칸뿐이다. 그때 `back()`을 부르면 링크 이동만 취소되고 아무 일도 안 일어나
 *    **버튼이 죽은 것처럼 보인다**(새 탭에서는 `href`로 가야 한다).
 */
function cameFromSameOrigin(): boolean {
  if (typeof document === "undefined" || !document.referrer) return false;
  if (window.history.length <= 1) return false;
  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
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
