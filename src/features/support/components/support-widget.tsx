"use client";

import { HelpCircle, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { ZLogo } from "@/components/icons/z-logo";

import {
  FAQ_CATEGORY_LABEL,
  FAQ_FALLBACK,
  FAQ_GREETING,
  FAQ_NARROW,
  type FaqCategory,
  type FaqEntry,
} from "../faq";
import { entriesOfCategory } from "../faq-entries";
import { findFaqCandidates } from "../match";
import { SupportThread, type Turn } from "./support-thread";

/**
 * 랜딩 우하단 도움말.
 *
 * ⚠️ **AI라고 부르지 않는다.** 미리 적어 둔 답을 키워드로 찾아 주는 것뿐이다
 *    (CLAUDE.md §AI 기능: AI 아닌 것을 AI라 부르지 않는다).
 * ⚠️ **한 번에 답하지 않고 좁혀 간다.** 갈래를 고르고 → 질문을 고르면 → 답이 나온다.
 *    자유롭게 친 말도 여럿이 걸리면 되묻는다 — 잘못 짚는 것보다 낫다.
 * ⚠️ 서버를 부르지 않는다 — 답이 전부 번들 안에 있다. 그래서 즉시 뜨고 오프라인에서도 된다.
 * ⚠️ 색은 온보딩 도움말과 같은 `--guide-*` 토큰이다. 화면 위에 뜨는 조각이라
 *    **밝기 테마와 무관하게 어둡다** — 두 곳이 다른 톤이면 다른 제품처럼 보인다.
 */

/** 처음 화면 — 인사와 갈래 고르기 */
const OPENING: Turn = { kind: "categories", text: FAQ_GREETING };

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<readonly Turn[]>([OPENING]);

  /** 사람이 한 말 + 그에 대한 응답을 한 번에 붙인다 */
  const reply = (said: string, next: Turn) =>
    setTurns((prev) => [...prev, { kind: "said", text: said }, next]);

  const handleCategory = (category: FaqCategory) =>
    reply(FAQ_CATEGORY_LABEL[category], {
      kind: "choices",
      text: FAQ_NARROW,
      entries: entriesOfCategory(category),
    });

  const handlePick = (entry: FaqEntry) => reply(entry.question, { kind: "answer", entry });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const asked = input.trim();
    if (!asked) return;
    setInput("");

    /*
      ⚠️ 하나만 걸리면 바로 답하고, 여럿이면 **되묻는다.** 점수가 제일 높은 걸 그냥 내놓으면
         "요금" 하나로 세 가지가 걸릴 때 엉뚱한 답이 나간다.
    */
    const [first, ...rest] = findFaqCandidates(asked);
    if (!first) {
      reply(asked, { kind: "categories", text: FAQ_FALLBACK });
      return;
    }
    if (rest.length === 0) {
      reply(asked, { kind: "answer", entry: first });
      return;
    }
    reply(asked, { kind: "choices", text: FAQ_NARROW, entries: [first, ...rest] });
  };

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
          /*
            ⚠️ Esc로 닫힌다. 열어 놓고 나갈 길이 키보드에 없으면 갇힌다(§a11y).
               전역 리스너를 걸지 않는다 — 열면 입력칸으로 포커스가 들어오므로 여기서 다 받는다.
          */
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
          className="bg-guide-surface border-guide-border animate-in fade-in slide-in-from-bottom-2 fixed right-5 bottom-20 z-50 flex max-h-[min(70dvh,560px)] w-[min(calc(100vw-2.5rem),368px)] flex-col overflow-hidden rounded-2xl border shadow-2xl duration-200"
        >
          <div className="border-guide-border flex items-center gap-2.5 border-b px-4 py-3.5">
            {/*
              누가 말하는 창인지 **머리에서 한 번만** 알려 준다.
              ⚠️ 원 색은 **밝기를 따라간다** — 밝을 땐 흰 원에 먹색 Z, 어두울 땐 검은 원에 흰 Z.
                 패널 자체는 늘 어둡지만, 이 표식만은 사이트 로고와 같은 결로 읽히는 게 낫다.
            */}
            <span className="bg-landing-stage text-landing-dark-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
              <ZLogo className="size-3.5" aria-hidden />
            </span>

            <span>
              <span className="text-guide-foreground block text-[14px] leading-5 font-medium">
                도움말
              </span>
              {/* ⚠️ 무엇인지 정확히 말한다 — "AI 상담원"이 아니다 */}
              <span className="text-guide-muted block text-[11px] leading-4">
                자주 묻는 질문에서 찾아드려요
              </span>
            </span>

            {/* ⚠️ 처음 화면(갈래 고르기)으로 돌아갈 길 — 없으면 대화에 갇힌다 */}
            {turns.length > 1 && (
              <button
                type="button"
                onClick={() => setTurns([OPENING])}
                className="text-guide-muted hover:text-guide-foreground focus-visible:ring-guide-muted/40 ml-auto flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] leading-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
              >
                <RotateCcw className="size-3" aria-hidden />
                <span className="translate-y-px">처음으로</span>
              </button>
            )}
          </div>

          <SupportThread turns={turns} onPickCategory={handleCategory} onPickEntry={handlePick} />

          <form onSubmit={handleSubmit} className="border-guide-border border-t p-3">
            <label htmlFor="support-input" className="sr-only">
              궁금한 것을 입력하세요
            </label>
            <input
              id="support-input"
              /* 열면 바로 칠 수 있게 — 키보드로 여기까지 탭으로 걸어오게 두지 않는다 */
              autoFocus
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="직접 입력해도 돼요"
              autoComplete="off"
              className="text-guide-foreground placeholder:text-guide-muted/70 focus-visible:ring-guide-muted/40 border-guide-border h-10 w-full rounded-lg border bg-white/[0.04] px-3 text-[13px] focus-visible:ring-2 focus-visible:outline-hidden"
            />
          </form>
        </div>
      )}
    </>
  );
}
