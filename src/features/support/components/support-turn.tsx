"use client";

import { ArrowUpRight, Mail, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

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

const CHIP =
  "text-popover-foreground border-border focus-visible:ring-ring/40 flex w-full items-center gap-2 rounded-lg border bg-secondary px-3 py-1.5 text-left text-[12px] leading-[18px] transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:outline-hidden";

interface SupportTurnProps {
  turn: Turn;
  /** 첫 마디인지 — 문의처는 **되물었을 때만** 붙인다 */
  isOpening: boolean;
  onPickCategory: (category: FaqCategory) => void;
  onPickEntry: (entry: FaqEntry) => void;
}

/** 말풍선 하나 */
export function SupportTurn({ turn, isOpening, onPickCategory, onPickEntry }: SupportTurnProps) {
  // 사람이 한 말 — 오른쪽에 붙여 누가 한 말인지 모양으로 구분한다
  if (turn.kind === "said") {
    return (
      <p className="bg-foreground text-background ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-[12px] leading-[18px] break-keep">
        {turn.text}
      </p>
    );
  }

  return (
    /*
      ⚠️ 말풍선마다 Z 표식을 붙이지 않는다. 한 줄 걸러 같은 그림이 반복되면 시끄럽고,
         누가 말하는지는 **좌우 위치와 모양**으로 이미 구분된다 — 표식은 머리에 하나면 된다.
    */
    <div className="border-border bg-secondary max-w-[92%] rounded-2xl rounded-bl-sm border px-3.5 py-3">
      {/*
        ⚠️ `whitespace-pre-line` — 답에 넣어 둔 빈 줄이 그대로 문단이 된다.
        ⚠️ **평문이다.** 마크다운을 렌더하지 않으므로 답변에 별표를 쓰면 그대로 보인다 —
           강조가 필요하면 문장 구조로 푼다(§정직성).
      */}
      <p className="text-popover-foreground text-[12px] leading-[20px] break-keep whitespace-pre-line">
        {turn.kind === "answer" ? turn.entry.answer : turn.text}
      </p>

      {turn.kind === "categories" && (
        <ul className="flex flex-col gap-1 pt-2.5">
          {Object.values(FAQ_CATEGORY).map((category) => {
            const Icon = FAQ_CATEGORY_ICON[category];
            return (
              <li key={category}>
                <button type="button" onClick={() => onPickCategory(category)} className={CHIP}>
                  <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                  {/* 한글이 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
                  <span className="translate-y-px">{FAQ_CATEGORY_LABEL[category]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {turn.kind === "choices" && (
        <ul className="flex flex-col gap-1 pt-2.5">
          {turn.entries.map((entry) => (
            <li key={entry.id}>
              <button type="button" onClick={() => onPickEntry(entry)} className={CHIP}>
                <MessageCircleQuestion
                  className="text-muted-foreground size-3.5 shrink-0"
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
              className="text-popover-foreground border-border focus-visible:ring-ring/40 hover:bg-accent inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
            >
              {link.label}
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          ))}
        </div>
      )}

      {/* 못 찾았을 때만 문의처를 붙인다 — 답을 준 자리에 또 물어보라고 하면 어수선하다 */}
      {turn.kind === "categories" && !isOpening && (
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-muted-foreground border-border focus-visible:ring-ring/40 hover:text-popover-foreground hover:bg-accent mt-2.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] leading-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
        >
          <Mail className="size-3" aria-hidden />
          <span className="translate-y-px">{SUPPORT_EMAIL}</span>
        </a>
      )}
    </div>
  );
}
