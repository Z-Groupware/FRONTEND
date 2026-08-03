import type { SVGProps } from "react";

/**
 * 물음표 마크 — lucide `HelpCircle`에서 **바깥 원을 걷어낸** 물음표.
 *
 * ⚠️ 글자 `?`를 쓰지 않는다. 폰트마다 글자 상자 안에서 앉는 위치가 달라 원 안에 넣으면
 *    위로 뜨거나 왼쪽으로 쏠린다 — 크기를 바꿀 때마다 다시 어긋난다. 도형이면 그 문제가 없다.
 * ⚠️ 원을 걷어낸 도형을 그대로 쓰면 혼자 두기에 작고 가늘다. **1.3배로 키우고 획도 같이
 *    굵혔다**(2 → 2.6). 고리를 손으로 다시 그리지 않는다 — 반지름을 조금만 건드려도
 *    갈고리처럼 커지거나 좌우로 눌린 모양이 된다.
 * ⚠️ 점은 채운 원이다. 획이 굵어진 만큼 점도 같이 굵어져야 짝이 맞는다.
 * ⚠️ 잉크 상자의 중심이 **24 상자의 정중앙(12, 12)** 에 오도록 좌표를 잡았다.
 *    배지·버튼 원 가운데에 두면 별도 보정이 필요 없다.
 */
export function QuestionMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      {/* 고리 — 왼쪽에서 위를 돌아 오른쪽으로, 거기서 안쪽으로 말려 목이 내려온다 */}
      <path
        d="M8.22 8.1 A3.9 3.9 0 0 1 15.8 9.4 C15.8 12 11.9 13.3 11.9 13.9"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="18.2" r="1.5" fill="currentColor" />
    </svg>
  );
}
