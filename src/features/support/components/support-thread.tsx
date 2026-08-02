"use client";

import { ArrowUpRight, Mail, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

import { ZLogo } from "@/components/icons/z-logo";

import {
  FAQ_CATEGORY,
  FAQ_CATEGORY_ICON,
  FAQ_CATEGORY_LABEL,
  type FaqCategory,
  type FaqEntry,
  SUPPORT_EMAIL,
} from "../faq";

/**
 * 오간 말 한 마디.
 *
 * ⚠️ 네 가지뿐이다 — 사람이 한 말 · 갈래 고르기 · 질문 고르기 · 답.
 *    "되묻기"를 따로 두는 게 이 화면의 핵심이다. 바로 답하면 잘못 짚는다.
 */
export type Turn =
  | { kind: "said"; text: string }
  | { kind: "categories"; text: string }
  | { kind: "choices"; text: string; entries: readonly FaqEntry[] }
  | { kind: "answer"; entry: FaqEntry };

interface SupportThreadProps {
  turns: readonly Turn[];
  onPickCategory: (category: FaqCategory) => void;
  onPickEntry: (entry: FaqEntry) => void;
}

const CHIP =
  "text-guide-foreground border-guide-border focus-visible:ring-guide-muted/40 flex w-full items-center gap-2 rounded-lg border bg-white/[0.04] px-3 py-2 text-left text-[12px] leading-[18px] transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:outline-hidden";

/**
 * 주고받은 내용.
 *
 * ⚠️ 답은 **문단 단위로 끊어** 보여준다(`whitespace-pre-line`). 한 덩어리로 흘리면
 *    말풍선 안이 글 벽이 돼서 아무도 안 읽는다.
 * ⚠️ `role="log"` — 답이 새로 붙는 걸 스크린 리더가 따라 읽는다.
 */
export function SupportThread({ turns, onPickCategory, onPickEntry }: SupportThreadProps) {
  return (
    <div role="log" className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
      {turns.map((turn, index) => {
        // 사람이 한 말 — 오른쪽에 붙여 누가 한 말인지 모양으로 구분한다
        if (turn.kind === "said") {
          return (
            <p
              key={index}
              className="bg-guide-foreground text-guide-surface ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-[12px] leading-[18px] break-keep"
            >
              {turn.text}
            </p>
          );
        }

        return (
          /* 말하는 쪽이 누구인지 표식으로 알린다 — 사람 말은 오른쪽, Z는 왼쪽에 표식과 함께 */
          <div key={index} className="flex max-w-[95%] items-start gap-2">
            <span className="bg-guide-foreground text-guide-surface mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
              <ZLogo className="size-2.5" aria-hidden />
            </span>

            <div className="border-guide-border min-w-0 flex-1 rounded-2xl rounded-bl-sm border bg-white/[0.04] px-3.5 py-3">
              {/* ⚠️ `whitespace-pre-line` — 답에 넣어 둔 빈 줄이 그대로 문단이 된다 */}
              <p className="text-guide-foreground text-[12px] leading-[20px] break-keep whitespace-pre-line">
                {turn.kind === "answer" ? turn.entry.answer : turn.text}
              </p>

              {turn.kind === "categories" && (
                <ul className="flex flex-col gap-1.5 pt-3">
                  {Object.values(FAQ_CATEGORY).map((category) => {
                    const Icon = FAQ_CATEGORY_ICON[category];
                    return (
                      <li key={category}>
                        <button
                          type="button"
                          onClick={() => onPickCategory(category)}
                          className={CHIP}
                        >
                          <Icon className="text-guide-muted size-3.5 shrink-0" aria-hidden />
                          {/* 한글이 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
                          <span className="translate-y-px">{FAQ_CATEGORY_LABEL[category]}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {turn.kind === "choices" && (
                <ul className="flex flex-col gap-1.5 pt-3">
                  {turn.entries.map((entry) => (
                    <li key={entry.id}>
                      <button type="button" onClick={() => onPickEntry(entry)} className={CHIP}>
                        <MessageCircleQuestion
                          className="text-guide-muted size-3.5 shrink-0"
                          aria-hidden
                        />
                        <span className="translate-y-px">{entry.question}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {turn.kind === "answer" && turn.entry.links && (
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {turn.entry.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-guide-foreground border-guide-border focus-visible:ring-guide-muted/40 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-4 transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:outline-hidden"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </Link>
                  ))}
                </div>
              )}

              {/* 못 찾았을 때만 문의처를 붙인다 — 답을 준 자리에 또 물어보라고 하면 어수선하다 */}
              {turn.kind === "categories" && index > 0 && (
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-guide-muted border-guide-border focus-visible:ring-guide-muted/40 hover:text-guide-foreground mt-2.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] leading-4 transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:outline-hidden"
                >
                  <Mail className="size-3" aria-hidden />
                  <span className="translate-y-px">{SUPPORT_EMAIL}</span>
                </a>
              )}
            </div>
          </div>
        );
      })}

      {/*
        새 말이 붙으면 **알아서 아래로 내려간다** — 직접 스크롤하게 두면 답이 왔는지도 모른다.
        ⚠️ `key`가 개수라 한 마디 늘 때마다 이 표식이 새로 붙고, 그때 ref 콜백이 돈다.
           `useEffect` 없이 "새로 붙었을 때"를 잡는 방법이다.
        ⚠️ `scrollIntoView`가 아니라 **상자만** 굴린다 — 페이지까지 같이 움직이면 안 된다.
      */}
      <div
        key={turns.length}
        aria-hidden
        ref={(node) => {
          const box = node?.parentElement;
          box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
        }}
      />
    </div>
  );
}
