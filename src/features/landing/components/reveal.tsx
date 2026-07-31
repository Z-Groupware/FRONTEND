import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 자리만 잡는 껍데기.
 *
 * ⚠️ **등장 애니메이션을 뺐다.** `IntersectionObserver`로도, CSS만으로도
 *    일부 블록이 투명한 채로 남았다(브라우저에서 5~13개 확인). 원인을 못 잡은 채
 *    두면 랜딩에서 글이 안 보인다 — 애니메이션이 없는 것보다 훨씬 나쁘다.
 *    껍데기는 남겨두니, 원인을 잡으면 여기 한 곳만 고치면 된다.
 */
export function Reveal({
  children,
  delay: _delay = 0,
  className,
}: {
  children: ReactNode;
  /** 원래 순서대로 뜨게 하려던 지연(ms). 지금은 쓰지 않는다 */
  delay?: number;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
