/**
 * 옮겨 간 자리를 가리키는 얇은 재수출.
 *
 * ⚠️ 이 카드는 이제 `components/common/summary-card.tsx`에 산다(운영자 전용이 아니라
 *    대시보드 공용이다). 부르는 쪽(운영자 화면 셋)의 import를 지금 바꾸지 않는 건 그 파일들이
 *    **다른 PR(#241)에서 손대는 중**이라서다 — 같은 줄을 양쪽에서 고치면 충돌만 만든다.
 * ⚠️ #241이 머지되면 이 파일을 지우고 부르는 쪽을 공용 경로로 바꾼다.
 */
export { SummaryCard } from "@/components/common/summary-card";
