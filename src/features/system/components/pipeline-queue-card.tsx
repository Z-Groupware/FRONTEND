import Link from "next/link";

import type { PipelineQueueSummary } from "../types";

/**
 * 대시보드 곁 컬럼의 "처리 큐" 카드.
 *
 * ⚠️ **"플랜 분포" 도넛이 있던 자리다.** 요금제가 하나뿐이라 "분포"라는 개념이 없어졌는데
 *    (CLAUDE.md §요금제), 빈 자리를 채우려고 없는 지표를 지어내지 않는다(§정직성) —
 *    **이미 있는 값**(시스템 모니터링의 처리 큐)을 옮겨 왔다.
 * ⚠️ 대시보드의 나머지는 전부 기업·매출 축이라 시스템이 지금 건강한지는 아무 데도 없었다.
 *    운영자가 처음 여는 화면이니 여기 있는 편이 맞다.
 * ⚠️ **숫자만 보여주고 조작은 안 한다.** 재처리는 시스템 모니터링에서 한다 — 같은 버튼을
 *    두 곳에 두면 어디서 눌렀는지에 따라 결과가 다른 것처럼 보인다.
 */
export function PipelineQueueCard({ queue }: { queue: PipelineQueueSummary }) {
  const rows = [
    { label: "대기", value: `${queue.waitingCount}건`, meta: "처리 예정" },
    {
      label: "처리 중",
      value: `${queue.processingCount}건`,
      meta: `평균 ${queue.processingAvgSeconds}초`,
    },
    { label: "재처리 필요", value: `${queue.failedCount}건`, meta: "처리 실패", isFailure: true },
  ];

  return (
    <section className="border-border bg-card flex w-full flex-col rounded-2xl border lg:w-64 lg:shrink-0">
      <h2 className="flex items-center gap-2 px-7 pt-6 pb-3 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        처리 큐
      </h2>

      {/* ⚠️ 남는 높이는 목록이 먹는다 — 옆 차트 카드가 늘 더 길어서, 내용을 위에 몰아 두면
          이 카드만 아래가 통째로 빈다(DESIGN §1: `items-start`를 쓰지 않는다). */}
      <ul className="flex flex-1 flex-col justify-center gap-5 px-7 py-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-baseline justify-between gap-3">
            <span className="flex flex-col">
              <span className="text-foreground text-[13px] leading-5">{row.label}</span>
              <span className="text-muted-foreground text-xs leading-4">{row.meta}</span>
            </span>
            {/*
              ⚠️ 색으로 알리는 건 **에러(빨강)뿐**이다(CLAUDE.md §디자인 토큰).
                 실패가 0건이면 알릴 게 없으므로 빨강도 안 쓴다 — 늘 빨간 줄은 곧 안 읽힌다.
            */}
            <span
              className={`text-[17px] leading-7 font-semibold tabular-nums ${
                row.isFailure && queue.failedCount > 0 ? "text-destructive" : "text-foreground"
              }`}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/system/monitor"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring border-border mx-7 mt-auto border-t py-4 text-xs underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        시스템 모니터링에서 보기
      </Link>
    </section>
  );
}
