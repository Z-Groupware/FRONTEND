"use client";

import { HelpCircle, X } from "lucide-react";
import { useState } from "react";

import { FAQ_ENTRIES, type FaqEntry } from "../faq";
import { findFaqAnswer } from "../match";
import { SupportThread, type Turn } from "./support-thread";

/**
 * 랜딩 우하단 도움말.
 *
 * ⚠️ **AI라고 부르지 않는다.** 미리 적어 둔 답을 키워드로 찾아 주는 것뿐이다
 *    (CLAUDE.md §AI 기능: AI 아닌 것을 AI라 부르지 않는다). 화면 문구도 "도움말"이다.
 * ⚠️ 서버를 부르지 않는다 — 답이 전부 번들 안에 있다. 그래서 즉시 뜨고 오프라인에서도 된다.
 * ⚠️ 색은 온보딩 도움말과 같은 `--guide-*` 토큰이다. 화면 위에 뜨는 조각이라
 *    **밝기 테마와 무관하게 어둡다** — 두 곳이 다른 톤이면 다른 제품처럼 보인다.
 */
export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<readonly Turn[]>([]);

  const ask = (question: string, found: FaqEntry | null) => {
    setTurns((prev) => [...prev, { question, entry: found }]);
    setInput("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const asked = input.trim();
    if (!asked) return;
    ask(asked, findFaqAnswer(asked));
  };

  /** 목록에서 고른 건 검색을 거치지 않는다 — 이미 어느 항목인지 안다 */
  const handlePick = (entry: FaqEntry) => ask(entry.question, entry);

  return (
    <>
      {/*
        ⚠️ `fixed`라 스크롤과 무관하게 늘 같은 자리에 있다. 우하단은 고객센터 위젯이 있는
           자리로 이미 알려져 있어 설명이 필요 없다.
      */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "도움말 닫기" : "도움말 열기"}
        className="bg-guide-surface text-guide-foreground focus-visible:ring-ring fixed right-5 bottom-5 z-50 flex size-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:outline-hidden"
      >
        {isOpen ? (
          <X className="size-5" aria-hidden />
        ) : (
          <HelpCircle className="size-5" aria-hidden />
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="도움말"
          className="bg-guide-surface border-guide-border animate-in fade-in slide-in-from-bottom-2 fixed right-5 bottom-20 z-50 flex max-h-[min(70dvh,560px)] w-[min(calc(100vw-2.5rem),368px)] flex-col overflow-hidden rounded-2xl border shadow-2xl duration-200"
        >
          <div className="border-guide-border flex items-baseline gap-2 border-b px-4 py-3.5">
            <p className="text-guide-foreground text-[14px] leading-5 font-medium">도움말</p>
            {/* ⚠️ 무엇인지 정확히 말한다 — "AI 상담원"이 아니다 */}
            <p className="text-guide-muted text-[11px] leading-4">자주 묻는 질문에서 찾아드려요</p>
          </div>

          <SupportThread turns={turns} entries={FAQ_ENTRIES} onPick={handlePick} />

          <form onSubmit={handleSubmit} className="border-guide-border border-t p-3">
            <label htmlFor="support-input" className="sr-only">
              궁금한 것을 입력하세요
            </label>
            <input
              id="support-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="궁금한 것을 물어보세요"
              autoComplete="off"
              className="text-guide-foreground placeholder:text-guide-muted/70 focus-visible:ring-guide-muted/40 border-guide-border h-10 w-full rounded-lg border bg-white/[0.04] px-3 text-[13px] focus-visible:ring-2 focus-visible:outline-hidden"
            />
          </form>
        </div>
      )}
    </>
  );
}
