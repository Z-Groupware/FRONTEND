import { PIPELINE_STAGE_LABEL, type PipelineStage } from "@/constants/domain";

import type { StageTiming } from "../types";

/**
 * 단계별 막대 색 — 파이프라인 4단계를 **명도가 아니라 색상**으로 구분한다(막대 4개가 같은 색이면
 * 어느 단계가 오래 걸리는지 길이로만 읽어야 해 시선이 흩어진다). 값은 전부 디자인 토큰이라
 * 다크모드가 그대로 따라온다(CLAUDE.md §디자인 토큰: 생 hex 금지).
 */
const STAGE_BAR_CLASS: Record<PipelineStage, string> = {
  UPLOAD: "bg-chart-2",
  TRANSCRIBE: "bg-success",
  SUMMARIZE: "bg-warning",
  EXTRACT_ACTION: "bg-chart-1",
};

/** "단계별 평균 소요 시간" 카드 — 가로 막대. 순수 표시라 서버에서 그린다. */
export function StageTimingCard({ timings }: { timings: StageTiming[] }) {
  if (timings.length === 0) {
    return (
      <section className="border-border bg-card rounded-xl border p-5">
        <h2 className="text-foreground text-sm font-semibold">단계별 평균 소요 시간</h2>
        <p className="text-muted-foreground mt-6 text-center text-xs">
          아직 집계된 처리 기록이 없어요
        </p>
      </section>
    );
  }

  // 가장 오래 걸린 단계를 100%로 잡아 나머지를 상대 길이로 그린다.
  const maxSeconds = Math.max(...timings.map((timing) => timing.avgSeconds));

  return (
    <section className="border-border bg-card rounded-xl border p-5">
      <h2 className="text-foreground text-sm font-semibold">단계별 평균 소요 시간</h2>

      <div className="mt-4 flex flex-col gap-3">
        {timings.map((timing) => (
          <div key={timing.stage} className="flex items-center gap-3">
            <span className="text-muted-foreground w-20 shrink-0 text-xs">
              {PIPELINE_STAGE_LABEL[timing.stage]}
            </span>
            <div className="bg-muted h-4 flex-1 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-[width] duration-[250ms] ${STAGE_BAR_CLASS[timing.stage]}`}
                style={{ width: `${(timing.avgSeconds / maxSeconds) * 100}%` }}
              />
            </div>
            <span className="text-muted-foreground w-12 shrink-0 text-right text-xs tabular-nums">
              {timing.avgSeconds}s
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
