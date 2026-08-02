import { Mic, Sparkles } from "lucide-react";

import { MockHead } from "./flow-mock-head";

/*
  ⚠️ 자막은 화자 없는 청크다 — 이름을 붙이지 않는다(명세).
  ⚠️ 담당자도 **이름 대신 자리(부서·직무)** 로 적는다. 목이라도 특정 인물처럼 읽히면 안 된다.
*/
const CAPTURE_CHUNKS = [
  { at: "07:41", text: "이번 스프린트 블로커부터 정리하죠" },
  { at: "07:58", text: "API 문서 최신화가 계속 밀리고 있어요" },
  { at: "08:14", text: "그럼 이번 주 안에 끝내는 걸로 하죠" },
  { at: "08:22", text: "디자인 기준 문서도 이번에 같이 잡죠" },
  { at: "08:35", text: "KPI 지표는 다음 회의에서 다시 볼게요" },
  { at: "08:47", text: "네, 여기까지 정리하고 마치겠습니다" },
] as const;

const ANALYZED = [
  { tag: "결정", color: "#3b82f6", text: "스프린트 블로커 우선 처리", meta: "회의 07:58 구간" },
  { tag: "액션", color: "#8b5cf6", text: "API 문서 최신화", meta: "담당 후보 · 개발 담당" },
  { tag: "액션", color: "#8b5cf6", text: "디자인 기준 문서 작성", meta: "담당 후보 · 디자인 담당" },
  { tag: "요약", color: "#22c55e", text: "3줄 요약 · 결정 2건 · 액션 3건", meta: "회의 종료 즉시" },
] as const;

export function CaptureMock() {
  return (
    <>
      <MockHead
        left={
          <>
            <span className="bg-landing-green size-[6px] animate-pulse rounded-full" aria-hidden />
            <span className="text-landing-green">녹음 중</span>
            <span className="text-landing-dark-muted">· 자막 자동 기록</span>
          </>
        }
        right="00:08:23"
      />

      <div className="flex flex-col gap-1.5 pt-3">
        {CAPTURE_CHUNKS.map((chunk, index) => (
          <p
            key={chunk.at}
            style={{ animationDelay: `${index * 0.45}s` }}
            className="border-landing-dark-border animate-cycle-in flex items-start gap-2.5 rounded-md border px-3 py-1.5 text-[12px] leading-[18px] break-keep"
          >
            <span className="text-landing-dark-muted shrink-0 tabular-nums">{chunk.at}</span>
            {chunk.text}
          </p>
        ))}
      </div>

      {/* 아래는 `mt-auto`로 바닥에 붙인다 — 패널 높이가 고정이라 짧은 단계도 비지 않는다 */}
      <div className="border-landing-dark-border mt-auto flex items-center justify-between border-t pt-3">
        <p className="text-landing-dark-muted flex items-center gap-1.5 text-[11px] leading-4">
          <Mic className="size-3" aria-hidden />
          녹음 파일도 함께 보관돼요
        </p>
        {/* 소리가 들어오는 중 — 파형이 뛴다 */}
        <span className="flex h-4 items-end gap-[2px]" aria-hidden>
          {[8, 14, 6, 12, 16, 9, 13].map((height, index) => (
            <span
              key={index}
              style={{ height, animationDelay: `${(index % 4) * 0.15}s` }}
              className="animate-eq bg-landing-green/70 w-[2px] rounded-full"
            />
          ))}
        </span>
      </div>
    </>
  );
}

export function AnalyzeMock() {
  return (
    <>
      <MockHead
        left={
          <>
            <Sparkles className="text-landing-violet size-3.5" aria-hidden />
            <span className="text-landing-violet">AI 분석 완료</span>
          </>
        }
        right="2.4초"
      />

      <div className="flex flex-col gap-2 pt-3">
        {ANALYZED.map((row, index) => (
          <div
            // 태그("액션")는 두 번 나온다 — 목록에서 유일한 건 문장 쪽이다
            key={row.text}
            style={{ animationDelay: `${index * 0.45}s` }}
            className="border-landing-dark-border animate-cycle-in flex items-center gap-2.5 rounded-md border px-3 py-1.5"
          >
            <span
              className="shrink-0 rounded px-2 py-0.5 text-[11px] leading-4 font-semibold text-white"
              style={{ backgroundColor: row.color }}
            >
              {row.tag}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] leading-5">{row.text}</span>
              <span className="text-landing-dark-muted block text-[11px] leading-4">
                {row.meta}
              </span>
            </span>
          </div>
        ))}
      </div>

      <p className="text-landing-dark-muted border-landing-dark-border mt-auto border-t pt-3 text-[11px] leading-4">
        확신이 낮은 항목만 개설자가 확인해요 — 나머지는 그대로 배정돼요
      </p>
    </>
  );
}
