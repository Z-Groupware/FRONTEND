import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

import { AI_CONFIDENCE, AI_CONFIDENCE_LABEL, type AiConfidence } from "@/constants/meeting";

interface ActionReviewGroupProps {
  confidence: AiConfidence;
  count: number;
  children: ReactNode;
}

/**
 * 확신도 그룹 카드 — "확신도 높음"/"확인 필요"는 **색이 아니라 아이콘으로 가른다**
 * (DESIGN.md §5: 상태점 외 색 사용 금지, 같은 모양이 여럿이면 아이콘으로 구분).
 */
export function ActionReviewGroup({ confidence, count, children }: ActionReviewGroupProps) {
  const Icon = confidence === AI_CONFIDENCE.HIGH ? CircleCheck : CircleAlert;

  return (
    <section className="border-border bg-card rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <Icon className="text-foreground size-4" aria-hidden />
          {AI_CONFIDENCE_LABEL[confidence]}
        </h2>
        <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">{count}건</p>
      </div>
      {count > 0 ? (
        children
      ) : (
        <p className="text-muted-foreground px-7 pt-1 pb-6 text-[13px] leading-5">
          여기 해당하는 항목이 없습니다.
        </p>
      )}
    </section>
  );
}
